from findEmail import CustErr
from blogScraper import get_everything
from urlAuthority import get_url_data

def handle_err(e, url, indexnum):
    return ({
        "context": "ERROR" + (str(indexnum) if indexnum>0 else '') + " " + str(e),
        "email": "ERROR" + str(indexnum) if indexnum>0 else '',
        "subject": "ERROR" + str(indexnum) if indexnum>0 else '',
        "body": "ERROR" + str(indexnum) if indexnum>0 else '',
        'url': url
    },indexnum)  


async def write_email(url, indexnum=-1, needs_address=False):
    try:
        information = await get_everything(url, needs_address)
        if type(information)==CustErr:
            print(information)
            return handle_err(information.message, url, indexnum) 
        title_summaries = information['title_summaries']
        to_team = information['to_team']
        # url_authority_data = get_url_data(url)
        # da = url_authority_data['domain_authority'] or None
        # traffic = url_authority_data['traffic'] or None
        # backlink_value = da*math.log(traffic)/2 if da and traffic else None
        rv = {}
        rv['context'] = 'For ' + information['company'] + ' (' + url + ')\n\nArticle Title: ' + information['title'] + '\n\nAuthor: ' + information['author']
        rv['email'] = information['email'] if information['email'] else "NO EMAIL FOUND"
        rv['subject'] = ("G" if to_team else information['author_first'] + ", g") + "reat article on " + title_summaries[0]
        rv['body'] = 'Hey, ' + (information['team_name'] if to_team else information['author_first']) + ',\n\nI loved your article about '  + title_summaries[1] + '! ' + information['very_interesting'] 
        rv['url'] = information['url']
        rv['provided_url'] = url
        # rv['domain_authority']=da
        # rv['traffic']=traffic
        # rv['seo_value']=url_authority_data['cost'] or None
        # rv['backlink_value'] = backlink_value
        return (rv, indexnum)
    except Exception as e:
        return handle_err(e, url, indexnum)  
