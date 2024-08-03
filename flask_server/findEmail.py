import os
import numpy as np

import requests
from openai import AsyncOpenAI
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore
from googleapiclient.discovery import build

import secret
from string_parser import custom_trim, filter_not_utf8

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}

class CustErr:
    """A custom error class. This is so I can write
    if type(res)==CustErr: return res
    instead of raising an error. This might help with asyncronous code."""

    message: str

    def __init__(self, message=''):
        self.message = message

async def find_email_sequence(name, url, company)-> tuple[str, str] | None:
    """Returns the email and a string of what type of email it is"""
    firebase_res = await find_email_firestore(name, url)
    if firebase_res: return (firebase_res[0], "firestore " + firebase_res[1])
    if not name: return None
    email_rv = await find_email_apollo(name, url, company)
    if email_rv: return (email_rv[0], "apollo")
    return None

async def find_email_firestore(name, url)-> tuple[str, str] | None:
    """Returns a tuple with the email and a description of the type of email"""
    initialize_firebase()
    db = firestore.client()
    firebase_url = '\\'.join(url.split('/'))
    ref = db.collection('sites').document(firebase_url)
    doc = ref.get()
    if not doc.exists: return None
    data = doc.to_dict()
    if 'email' in data:
        possible_email = data['email']
        if '/' not in possible_email and '%' not in possible_email:
            return (data['email'], 'company')
        else:
            ref.update({
                "actualAddress": False
            })
    if not name: return None
    authors = ref.collection('authors')
    authors_ref = authors.document(name).get()
    if not authors_ref.exists:
        return None
    return (authors_ref.to_dict()['email'], 'personal')

async def find_email_apollo(name:str, url: str, company_name: str)-> list[str]:
    api_loc = "https://api.apollo.io/api/v1/people/match"

    data = {
        "api_key": os.environ['APOLLO_API_KEY'],
        "reveal_personal_emails": True,
        "first_name": name.split(' ')[0],
        "last_name": name.split(' ')[-1],
        "domain": url,
        "organization_name": company_name
    }
    headers = {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
    }
    response = requests.request("POST", api_loc, headers=headers, json=data)
    json_res = response.json()
    person = json_res['person']
    possible_emails = []
    if person:
        email = person['email']
        if email and '@' in email:
            possible_emails.append(email)
        personal_emails = person['personal_emails']
        for personal_email in personal_emails:
            if personal_email and '@' in personal_email:
                possible_emails.append(personal_email)
    return possible_emails

def find_word_anchor(a_soup, word):
    a_texts = list(map(lambda x: x.text, a_soup))
    possible_contact_texts = []
    for i in range(len(a_texts)):
        a_text = a_texts[i]
        if word in a_text.lower():
            possible_contact_texts.append((a_text,i))
    contact_texts = []
    if len(possible_contact_texts) >1:
        for text in possible_contact_texts:
            if len(custom_trim(text[0]))<20:
                contact_texts.append(text)
    else: contact_texts = possible_contact_texts
    return contact_texts[-1] if contact_texts else None

# Finds the most similar element of the string array and returns the strings' indexes
async def most_similar(strings, arr):
    embeddings = []
    client = AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY")
    )
    for i in range(len(arr)):
        if arr[i]:
            # Embedding each element
            embedding = await client.embeddings.create(input = [filter_not_utf8(arr[i])], model='text-embedding-ada-002')
            embeddings.append((np.array(embedding.data[0].embedding), i)) # type: ignore
    rv = []
    for string in strings:
        embedding = await client.embeddings.create(input = [string], model='text-embedding-ada-002')
        str_vect = np.array(embedding.data[0].embedding) # type: ignore
        min_dist = 2
        min_index = -1.5

        for i in range(len(embeddings)):
            emb = embeddings[i]
            dist = np.linalg.norm(str_vect - emb[0])
            if dist < min_dist:
                min_dist = dist
                min_index = emb[1]
        rv.append(min_index)
    return rv

def initialize_firebase():
    try:
        firebase_admin.initialize_app(credentials.Certificate('serviceAccount.json'))
    except ValueError:
        return

async def find_company_email(url, a_soup, words=['contact', 'about']):
    global headers
    contact_anchor = None
    for word in words:
        if not contact_anchor: contact_anchor = find_word_anchor(a_soup, word)
    if not contact_anchor: return None
    href = a_soup[contact_anchor[1]]['href']
    if url not in href and 'www' not in href and 'http' not in href:
        if href[0] == '/':
            href = href[1:]
        href  = custom_trim(url.split('?')[0], '/', '') + '/' + href
    contact_r = requests.get(href, headers=headers)
    if contact_r.status_code != 200:
        return None
    r_soup = BeautifulSoup(contact_r.content, 'html5lib')
    return await get_email_from_rsoup(r_soup)

async def get_email_from_rsoup(r_soup):
    def get_href(x):
        if  'href' in x.attrs: 
            return x['href']
        return None
    r_soup_hrefs = list(map(get_href, r_soup.find_all('a')))
    email_hrefs = []
    for href in r_soup_hrefs: 
        if href and ('@' in href and '/' not in href and '%' not in href):
            email_hrefs.append(href)
    if not email_hrefs: return None
    email = email_hrefs[(await most_similar(['contact@company.com'], email_hrefs))[0]]
    if 'mailto:' in email:
        email = email.split('mailto:')[-1]
    return (email if '@' in email else None)

async def inurl_email(url):
    try:
        global headers
        query = 'inurl:' + url + ' "email"'
        service = build("customsearch", "v1", developerKey=os.environ['GOOGLE_API_KEY'])
        google_res = service.cse().list(q=query, cx='e3d6fd3b2065c471b', num=2).execute()['items']
        email_urls = list(map(lambda x: x['link'], google_res))
        email = None
        for email_url in email_urls: # Does not itterate through all of res will return something here
            if not email:
                r = requests.get(email_url,headers=headers)
                if r.status_code==200:
                    soup = BeautifulSoup(r.content, 'html5lib')
                    if soup:
                        email = await get_email_from_rsoup(soup)
        return email if email else None
    except Exception as e:
        return CustErr(str(e))
