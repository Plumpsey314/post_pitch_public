def very_interesting_prompt(text: str):
    return 'Given any text input from a blog article, provide an extremely brief response that starts with "Very interesting how" and reflects a surprising aspect of the text.\
    Your response has to be related to the context text you are given, but you should pick one part of the text that is the most surprising even if it is not the core detail of the paragraph.\
    When addressing the author, use the second person ("you") to maintain a personal tone. If addressing the author, do so in a positive or neutral tone. If the text does not appear to be from a blog article,\
    respond with "Not in article." Keep the response to a short sentence. Here is the context: ' + text

def company_name_prompt(url: str):
    return 'You are to deduce the name of a blogging company by the name of the url of their site. Your answer should just \
    be the name of the company in unabbreviated form. Do not include any other information: ' + url

def fix_company_name_prompt(string):
    return 'I want to get the name of the company, but not in a complete sentence. I will give you a string, and you will return the name \
    of the company, but the most important part is that you do not answer in a complete sentence. For example, If I give you the string \
    "The name of the blog site is Harvard Business Review", you return "Harvard Business Review". you DO NOT return "The name is Harvard Business Review."\
    because you should not answer in a complete sentence. Here is the string:  "' + string + '"'

def title_rephrase_prompt(title: str):
    return 'Give me 2 ways to synthesize this article. Make your 2 answers very similar but not identical to each other.\
    Only capture the main point and make grammatical sense and be SUPER brief (1-3 words).\
    Your response has to be a numbered list where each item is in this format: "I loved your article about {your 1-3 word summary}".\
    Here are some examples:\
    For the title: EastEnders star Davood Ghadami looks worlds away from Albert Square as he shows off ripped body and new beard\
    A good response is "1. I loved your article about Davood Ghadimi\'s glow up 2. I loved your article about Ghadimi getting jacked"\
    A bad response is "1. I loved your article about David Ghadimi looking better than Albert Square. 2. I loved your article about David Ghadimi getting jacked to look better than Albert Square"\
    While these summaries are accurate, they are a horrible response because they are way to long. Notice how I cut out some details in the good response to make it shorter.\
    For the title: TRAGIC LOSS Justyn Vicky death updates — Tributes pour in for bodybuilder, 33, who broke his neck during freak squat accident at gym\
    A good response it "1. I loved your article about the late Justyn Vicky. 2. I loved your article about a bodybuilder\'s death."\
    A bad response is "1. I loved your article about tragic gym accident. 2. I loved your article about tributes for bodybuilder."\
    These summaries suck because they do not make grammatical sense. No one talks like these atrocious examples.\
    Always choose to include an extra article or pronoun if it helps make more grammatical sense.\
    Your answer needs to flow nicely with the sentence. You are not coming up with an alternative title.\
    Do not include anything else in your response, especially not a note at the end. Here\'s the title you will do it with: ' + title

def find_author_prompt():
    return 'Who is the author? Respond with the answer to this question and no other information. Do not answer in a complete sentence.\
    If the answer is not clear, your responce should be "Not Clear". It is possible the author\'s name is present but not separated by a space.\
    For example in the string "Taylor Swift\'s new albumMegan Steinhart" the author is "Megan Steinhart". The author will always be a person and will never be a famous person.\
    If there are more than 1 authors, make your response a numbered list of authors. An example good response is "John Doe" if there is one author or\
    "1. Alice Smith 2. Bob Miller" if there are 2 authors An example bad response is "1. John Doe" If there is one author, do not provide a numbered list.\
    Another very bad response is "Alice Smith and Bob Miller" If there are 2 authors you NEED to provide it in the format of a numbered list. Here is the content: '

def find_blog_article_prompt(articles_count: str|int, num_needed):
    # Prompt may be excessive
    return 'Of these ' + str(articles_count) + ' strings, which ' + str(num_needed) + ' sound most like the title to a blog\
    article?' + ('Your answer should be in the form of a numbered list.' if num_needed >= 2 else '') + 'Realize, you are looking for the TITLE \
    of a blog article, this is very different from a title of a blog. A title of a blog article, something you should return is\
    something like "Best restaraunts in London" it is not the name of a blog company, but the title of an article. "mashable.com" is something you should not return.\
    These are examples. In reality, return one of the strings that were given to you. Do not return any aditional text/comment. Here is the content: '

def fix_find_blog_article_prompt(articles_count: str|int, num_needed):
    # Prompt may be excessive
    return 'Of these ' + str(articles_count) + ' strings, which ' + str(num_needed) + ' sound most like the title to a blog\
    article?' + ('Your answer should be in the form of a numbered list.' if num_needed >= 2 else '') + 'Realize, you are looking for the TITLE \
    of a blog article, this is very different from a title of a blog. A title of a blog article, something you should return is\
    something that is in the same format as "Best restaraunts in London" it is not the name of a blog company, but the title of an article. "mashable.com" is something you should not return.\
    DO NOT return the string "Best restaraunts in London" instead return one of the items in the context I will show you.\
    Return only the item in the list. Do not provide additional context or say "[item] looks the most like a blog article"\
    Remember. the most important thing is NOT to return "Best restaraunts in London" under any circumstance. That was just an example of something in the correct format. \
    Here is the context: '

def find_company_email_team(company, email):
    return 'Your job is to find the appropriate thing to address an email to. You will be given an email address and a company\
    name, and you should find the appropriate title for the receiver of the email address. For example, for the company Mashable,\
    and the email marketing@[company].com, you should return "[company] Press Team". However, if it is a catch-all email or \
    something that is not absolutely clear, just return "[company] Team". Do not return anything else in your response.\
    Here is the company: ' + company + ' And Here is the email address: ' + email

