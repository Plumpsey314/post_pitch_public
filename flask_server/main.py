import os
import json
from urllib.parse import unquote
import asyncio

from flask import Flask, request, jsonify, redirect, session, url_for
from flask_session import Session
from google_auth_oauthlib.flow import Flow
from flask_cors import CORS
from firebase_admin import firestore
import pickle
from googleapiclient.discovery import build

from emailWriter import write_email, handle_err
from blogScraper import get_everything
from findEmail import initialize_firebase, CustErr
from sendEmail import create_message, send_message

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['PREFERRED_URL_SCHEME'] = 'https'
app.config['SESSION_TYPE'] = 'filesystem'

Session(app)

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

async def get_everything_helper(url, needs_address, index):
    everything_obj = await get_everything(url, needs_address)
    if type(everything_obj)==CustErr:
        everything_obj = handle_err(everything_obj.message, url, index)
    return (everything_obj, index)

async def write_intro(needs_address, bare_bones):
    url = request.args.get('url')

    timeout=request.args.get('timeout')
    if not timeout:
        timeout = 180

    if ',' in url:
        urls = url.split(',')

        tasks = []

        for i, link in enumerate(urls):
            tasks.append(get_everything_helper(link, needs_address, i+1) if bare_bones else write_email(link, i + 1, needs_address))

        done, pending = await asyncio.wait(tasks, timeout=timeout)

        # Cancel all pending tasks
        for task in pending:
            task.cancel()

        results = [await task for task in done]

        results_no_none = [item for item in results if item is not None]
        
        sorted_res = sorted(results_no_none, key=lambda x: x[1])

        count = 1
        sorted_res_no_missing = []

        for res in sorted_res:
            while(res[1] != count and count <= len(urls)):
                sorted_res_no_missing.append(({"context": "ERROR" + str(count) + " TIMEOUT",
                    "email": "ERROR" + str(count),
                    "subject": "ERROR" + str(count),
                    "body": "ERROR" + str(count),
                    'url': urls[count-1]}, 1))
                count += 1
            sorted_res_no_missing.append(res)
            count += 1

        return list(map(lambda y: y[0], sorted_res_no_missing))

    email_obj = await get_everything_helper(url, needs_address, -1) if bare_bones else await write_email(url, needs_address)
    return email_obj[0]

@app.route('/email_data') # type: ignore
async def email_data():
    return await write_intro(needs_address=True, bare_bones=False)

@app.route('/email_data_lenient') # type: ignore
async def email_data_lenient():
    return await write_intro(needs_address=False, bare_bones=False)

@app.route('/object_data') # type: ignore
async def object_data():
    return await write_intro(needs_address=True, bare_bones=True)

@app.route('/object_data_lenient') # type: ignore
async def object_data_lenient():
    return await write_intro(needs_address=False, bare_bones=True)


@app.route('/authorize_email', methods=['POST'])
def authorize():
    """Made partially with ChatGPT"""
    # Get data from the frontend
    data = request.get_json()
    sender = data.get('sender')
    recipient = data.get('recipient')
    subject = data.get('subject')
    body = data.get('body')
    # Create flow instance to manage the OAuth 2.0 Authorization Grant Flow steps.
    flow = Flow.from_client_secrets_file(
        'credentials.json', scopes=SCOPES)
    unsecure_url = url_for('oauth2callback', _external=True)
    if 'http'==unsecure_url[0:4] and 'https'!=unsecure_url[0:5]:
        flow.redirect_uri = 'https'+unsecure_url[4:]
    else: # Otherwise the url is secure.
        flow.redirect_uri = unsecure_url
    # Store the data you want to pass to oauth2callback in the session
    state = json.dumps({
            'sender': sender,
            'recipient': recipient,
            'subject': subject,
            'body': body
        })

    authorization_url, state = flow.authorization_url(
        # Enable offline access so that you can refresh an access token without
        # re-prompting the user for permission. Recommended for web server apps.
        access_type='offline',
        # Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes='true',
        state=state
    )
    # Store the state so the callback can verify the auth server response.
    return jsonify({'url': authorization_url}), 200


@app.route('/oauth2callback')
def oauth2callback():
    """Made partially with ChatGPT"""
    # Specify the state when creating the flow in the callback so that it can
    # verified in the authorization server response.
    if os.path.exists('creds.pickle'):
        # If yes, load it
        with open('creds.pickle', 'rb') as token:
            creds = pickle.load(token)
    else:
        # Create flow instance to manage the OAuth 2.0 Authorization Grant Flow steps.
        flow = Flow.from_client_secrets_file(
            'credentials.json', scopes=SCOPES)
        flow.redirect_uri = url_for('oauth2callback', _external=True)

        flow = Flow.from_client_secrets_file(
            'credentials.json', scopes=SCOPES)
        flow.redirect_uri = url_for('oauth2callback', _external=True)

        # Use the authorization server's response to fetch the OAuth 2.0 tokens.
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        authorization_response = request.url
        if 'http'==flow.redirect_uri[0:4] and 'https'!=flow.redirect_uri[0:5]:
            flow.redirect_uri = 'https'+flow.redirect_uri[4:]
        flow.fetch_token(authorization_response=authorization_response)
        creds = flow.credentials
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    state = request.args.get('state', 'ERROR')
    if state=='ERROR':
        return jsonify({'status': 'error'}), 500
    state_data = json.loads(unquote(state))
    sender = state_data.get('sender', 'ERROR')
    recipient = state_data.get('recipient', 'ERROR')
    subject = state_data.get('subject', 'ERROR')
    body = state_data.get('body', 'ERROR')
    
    # Call the Gmail API
    service = build('gmail', 'v1', credentials=creds)

    # Create a message and send it
    message = create_message(sender, recipient, subject, body)
    sent_message = send_message(service, 'me', message)
    if sent_message:
        # I don't know what to put here
        return {'status': 'success'}
    else:
        return jsonify({'status': 'error'}), 500

if __name__=="__main__":
    app.run()