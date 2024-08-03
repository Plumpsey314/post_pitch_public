import random

import requests
from requests.exceptions import Timeout
from bs4 import BeautifulSoup
from firebase_admin import firestore

from gptFindInfo import get_articles, fix_get_articles, find_author, title_rephrase, company_name, fix_company_name, find_very_interesting, find_team_name
from string_parser import parse_url, custom_trim
from findEmail import find_company_email, find_email_sequence, most_similar, inurl_email, initialize_firebase, CustErr

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
}

def modify_r(url, addon, r):
    global headers
    if not r or type(r)==CustErr:
        try:
            r_slash_addon = requests.get(url+addon, headers=headers, timeout=10)
            print(r_slash_addon.status_code)
            if r_slash_addon.status_code == 200: r = r_slash_addon
        except Timeout:
            return CustErr('The request timed out')
    return r

async def get_blog_pages(url: str, guess_first_two=True):
    try:
        r = None
        if(guess_first_two):
            r = modify_r(url, 'articles', None)
            r = modify_r(url, 'blog', r)
        r = modify_r(url, '', r)
        if not r or type(r)==CustErr: return None
        return BeautifulSoup(r.content, 'html5lib')
    except Exception:
        # There are times where a request would throw an error instead of just being unsuccessful. 
        # These should be treated in the same way
        return None

def find_all_tags(soup, tag_name):
    """Finds all the tags with a certian type"""
    main_section = soup.find_all('main')
    if main_section:
        main_section = main_section[0]
        tags = main_section.find_all(tag_name)
        if tags:
            return tags

    # If nothing was returned from the main section
    all_links = soup.find_all(tag_name)
    if(tag_name=='a'):
        nav = soup.find('nav')
        nav_links = nav.find_all(tag_name) if nav else []
        header = soup.find('header')
        header_links = header.find_all(tag_name) if header else []
        return [link for link in all_links if link not in nav_links and link not in header_links]
    return all_links

async def get_blog_anchor(soup):
    articles = find_all_tags(soup, 'a')
    articles_text_content = list(map(lambda x: x.text, articles))
    if not articles_text_content: return CustErr('could not find any anchor tags')
    len_possible_articles = len(articles_text_content)
    # get a random selection of about 25 articles (getting about 30 assuming 5 are empty)
    chose_prob = 30/len_possible_articles
    chosen_articles = [] # Randomly chosen articles
    chosen_indecies = []
    chosen_count = 0
    for i in range(len(articles_text_content)):
        if random.random() < chose_prob:
            candidate = custom_trim(articles_text_content[i])
            if candidate:
                chosen_articles.append(candidate)
                chosen_indecies.append(i)
                chosen_count += 1
    # TODO a lot of timeouts arise from this method. Possibly fixed.
    actual_articles = await get_articles(chosen_articles, chosen_count) # Articles ChatGPT got
    # This is just getting the article from what ChatGPT said. The GPT result is conveniently in a cleaned up format, so
    # the strings are technically not the same but close enough.
    article_a_indecies = await most_similar(actual_articles, chosen_articles) 
    article_elems = list(map(lambda i: articles[chosen_indecies[i]], article_a_indecies))
    final_article = None
    final_author = None
    for article_elem in article_elems:
        if not final_article:
            parent_content = article_elem.parent
            temp_content = custom_trim(parent_content.text)
            if len(temp_content)<1000:
                temp_content = temp_content[0:1000]
            author = await find_author(temp_content)
            if type(author) == str and 'not clear' in author.lower():
                parent_content = parent_content.parent
                temp_content = custom_trim(parent_content.text)
                if len(temp_content)<1000:
                    temp_content = temp_content[0:1000]
                author = await find_author(temp_content)
            if type(author) != str or 'not clear' not in author.lower():
                final_article = article_elem
                final_author = author
    if not final_article: final_article = article_elems[0]
    if not final_author: final_author = None
    return (final_article, final_author, soup.find_all('a'))

def longest_and_index(arr: list[str]):
    longest = ''
    longest_len = 0
    longest_index = 0
    index_count = 0
    for string in arr:
        length = len(string)
        if length > longest_len:
            longest = string
            longest_len = length
            longest_index = index_count
        index_count += 1
    return (longest, longest_index)

def get_soup_from_href(url):
    global headers
    r = requests.get(url, headers=headers)
    status = r.status_code
    if status == 403: return CustErr("403 forbidden")
    if status != 200: return CustErr("Failed to visit "+ url +" with status code " + str(status))
    return BeautifulSoup(r.content, 'html5lib')

async def get_very_interesting(soup):
    paragraphs_text = list(map(lambda x: custom_trim(x.text), soup.find_all('p')))
    response = "not in article"
    count = 0
    longest_paragraph = ''
    longest_index = 0
    while count < 3 and custom_trim(response.lower(), trim_alphabet=' .,"\'') == "not in article":
        if count==3:
            return CustErr("No article information found.")
        li = longest_and_index(paragraphs_text)
        if type(li)==CustErr:
            return li
        longest_paragraph = li[0]
        longest_index = li[1]
        passage = longest_paragraph if len(longest_paragraph) < 1000 else longest_paragraph[0:1000]
        if len(passage)<300:
            passage = (paragraphs_text[longest_index -1] + ' ' if longest_index > 0 else '') + passage
            passage += ' ' + paragraphs_text[longest_index + 1] if longest_index + 1 < len(paragraphs_text) else ''
        response = await find_very_interesting(passage)     
        if longest_index < len(paragraphs_text)/2 and longest_index+1<len(paragraphs_text):
            paragraphs_text = paragraphs_text[longest_index+1:]
        else:
            paragraphs_text = paragraphs_text[0:longest_index]
        if paragraphs_text==[]: return CustErr("No article information found.")
        count += 1
    if response=='not in article':
        return CustErr("Could not find information that was in the article")
    return response

def add_email_to_db(url, email, author=None):
    """author is only the name of the author if the email is the author's email."""
    initialize_firebase()
    db = firestore.client()
    firebase_url = '\\'.join(url.split('/'))
    ref = db.collection('sites').document(firebase_url)
    doc = ref.get()
    if not doc.exists:
        ref.set({})
    if author:
        authors = ref.collection('authors')
        authors_ref = authors.document(author)
        if not authors_ref.get().exists:
            authors_ref.set({
                "email": email
            })
    else:
        if doc.exists and 'email' not in doc.to_dict():
            ref.update({
                "email": email,
                "secondaryEmail": "",
                "actualAddress": True
            })
        else:
            ref.set({
                "email": email,
                "secondaryEmail": ""
            })

async def complete_get_company(url):
    company = await company_name(url)
    if len(company.split(' ')) > 7:
        company = custom_trim(await fix_company_name(company))
        if len(company.split(' ')) > 6:
            company = custom_trim(await fix_company_name(company))
            if len(company.split(' ')) > 6:
                return CustErr("ChatGPT freeking can't figure out how to return a result that is just the company name")
    return company

async def get_title_from_soup(soup):
    title_tags = ['h1', 'h2', 'h3', 'h4']
    possible_title_elems = []

    for tag in title_tags:
        if len(possible_title_elems)==0:
            possible_title_elems = find_all_tags(soup, tag)
    if len(possible_title_elems)==0:
        return CustErr("Could not find an article title")
    
    possible_titles = list(map(lambda x: custom_trim(x.text), possible_title_elems))
    article = (await get_articles(possible_titles, len(possible_titles), 1))[0]
    if article == "Best restaraunts in London":
        article = (await fix_get_articles(possible_titles, len(possible_titles), 1))[0]
    return article

async def get_everything_one_page(url):
    company = await complete_get_company(url)
    if(type(company)==CustErr):
        return company
    soup = await get_blog_pages(url, False)
    if not soup:
        return CustErr("Could not get URL")
    article_title = await get_title_from_soup(soup)
    if type(article_title)==CustErr:
        return article_title
    rephrased_titles = await title_rephrase(article_title)
    if type(rephrased_titles)==CustErr:
        return article_title
    very_interesting= await get_very_interesting(soup)
    if type(very_interesting)==CustErr:
        return very_interesting
    return{
        "author": "None found",
        "author_first": None,
        "company": company,
        "email": "NO EMAIL FOUND",
        "team_name": company + " Team",
        "title": article_title,
        "title_summaries": rephrased_titles,
        "to_team": True,
        "url": url,
        "very_interesting": very_interesting
    }

async def get_everything(url, needs_address=False):
    print("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")
    if url[len(url)-1]=='/' :
        url = url[:-1]
    splitURL = url.split('/')
    # nearly fool proof way of distinguishing individual blog from general domain page.
    if(not needs_address and ('https://' in url or 'http://' in url) and len(splitURL)>3 and splitURL[3]!='' and len(splitURL[len(splitURL)-1])>=10):
        return await get_everything_one_page(url)
    # All this code is needed to find the emails.
    soup = None
    for possibleUrl in parse_url(url):
        if not soup:
            soup = await get_blog_pages(possibleUrl)
            if soup:
                url = possibleUrl
    if not soup: return CustErr("No url found")
    article_and_author = await get_blog_anchor(soup)
    if type(article_and_author) == CustErr:
        return article_and_author
    author = article_and_author[1]
    company = await complete_get_company(url)
    if(type(company)==CustErr):
        return company
    email = None
    used_firestore: bool = False
    to_team = False
    if type(author) == str or author==None:
        email_res = await find_email_sequence(author, url, company)
        if email_res:
            email = email_res[0]
            used_firestore = 'firestore' in email_res[1]
            to_team = 'company' in email_res[1]
    else:
        one_author = ''
        possible_email = ''
        # in this rare instant, author is a list
        for athr in author:
            if not email:
                email_res = await find_email_sequence(athr, url, company)
                if email_res:
                    if 'company' in email_res[1]:
                        possible_email = email_res[0]
                    else:
                        one_author = athr
                        email = email_res[0]
                        used_firestore = 'firestore' in email_res[1]
                        to_team = False
        author = one_author
        if not author and possible_email:
            email = possible_email
            used_firestore = True
            to_team = True
    if not email:
        to_team = True
        email = await find_company_email(url, article_and_author[2])
        if not email: 
            email = await inurl_email(url)
            if(needs_address):
                if type(email)==CustErr:
                    return email
                if not email:
                    return CustErr("Could not find email")
            else:
                email = ""
    if '?' in email: email = email.split('?')[0]
    author_first = None
    print("MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM")
    # team name
    team_name = (await find_team_name(company, email)) if to_team and email else company + " Team"

    # getting article soup
    article = article_and_author[0]
    href = article['href']
    if url not in href and 'www' not in href and 'http' not in href:
        if href[0] == '/':
            href = href[1:]
        href  = custom_trim(url.split('?')[0], '/', '') + '/' + href
    article_soup = get_soup_from_href(href)

    # Very Interesting part
    very_interesting = await get_very_interesting(article_soup)
    if type(very_interesting)==CustErr:
        return very_interesting
    # Title rephrase part
    article_title = await get_title_from_soup(article_soup)
    if type(article_title)==CustErr:
        return article_title
    rephrased_titles = await title_rephrase(article_title)
    if type(rephrased_titles)==CustErr:
        return rephrased_titles
    if len(rephrased_titles) != 2:
        return CustErr("Chat GPT incorectly repsonded.")
    if type(very_interesting)==CustErr:
        return very_interesting

    if author:
        author_first = author.split(' ')[0] if ',' not in author else author.split(' ')[1]
    else:
        author = "None found"
    if email and not used_firestore and '/' not in email and '%' not in email:
        add_email_to_db(url, email, None if to_team else author)
    print("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE")
    return{
        "author": author,
        "author_first": author_first,
        "company": company,
        "email": email,
        "team_name": team_name,
        "title": article_title,
        "title_summaries": rephrased_titles,
        "to_team": to_team,
        "url": url,
        "very_interesting": very_interesting
    }
