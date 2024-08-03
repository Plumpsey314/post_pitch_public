from openai import AsyncOpenAI
import secret
import os
import math
import random

from prompts import *
from string_parser import parse_num_list, custom_trim

async def qa(system_prompt, user_prompt):
    client = AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY")
    )
    gpt35_models = [
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-0301',
            'gpt-3.5-turbo-0613',
            'gpt-3.5-turbo-16k',
            'gpt-3.5-turbo-16k-0613'
        ]
    model=gpt35_models[math.floor(random.random()*float(len(gpt35_models)))]
    completion = await client.chat.completions.create(
        model=model,
        temperature=0,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content":  str(user_prompt)}
        ]
    )
    return completion.choices[0].message.content # type: ignore

async def get_articles(possible_articles, articles_count, num_needed=2):
    blog_prompt = find_blog_article_prompt(articles_count, num_needed)
    result = await qa('',blog_prompt + str(possible_articles))
    return parse_num_list(result)

async def fix_get_articles(possible_articles, articles_count, num_needed=2):
    blog_prompt = fix_find_blog_article_prompt(articles_count, num_needed)
    result = await qa('',blog_prompt + str(possible_articles))
    return parse_num_list(result)

async def find_author(text):
    rv= await qa('',find_author_prompt() + custom_trim(text))
    if '1.' in rv:
        return parse_num_list(rv)
    return rv

async def title_rephrase(title):
    prompt = title_rephrase_prompt(title)
    answer = await qa('', prompt)
    return list(map(lambda x: custom_trim(x.split('I loved your article about ')[-1], trim_alphabet=' \'.!?', cut_alphabet='"'), parse_num_list(answer)))

async def company_name(url):
    prompt = company_name_prompt(url)
    return await qa('', prompt)

async def fix_company_name(string):
    prompt = fix_company_name_prompt(string)
    return await qa('', prompt)

async def find_very_interesting(text):
    prompt = very_interesting_prompt(text)
    rv = await qa('', prompt)
    return custom_trim(rv)

async def find_team_name(company, email):
    prompt = find_company_email_team(company, email)
    return await qa('', prompt)
