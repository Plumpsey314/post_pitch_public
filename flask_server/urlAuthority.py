import requests

def get_url_data(url: str):
    """
        Data for the ahref documentation is here:
        https://ahrefs.com/api/documentation
    """
    rv = {
        "domain_authority": '',
        "traffic": '',
        "cost": '' # This is the amount expected you would need to pay to get this amount of traffic naturally.
    }
    AHREF_API_KEY = '0123456789abcdefgWEDONTHAVEONE'

    domain_authority_requrl = f'https://apiv2.ahrefs.com?from=domain_rating&target={url}&mode=domain&output=json&token={AHREF_API_KEY}'
    ahref_domain_authority = requests.get(domain_authority_requrl)
    if ahref_domain_authority.status_code!=200 or 'error' in str(ahref_domain_authority.content):
        rv['domain_authority'] = None
    else:
        rv['domain_authority'] = ahref_domain_authority.content['domain']['domain_rating']

    trafficcost_requrl = f'https://apiv2.ahrefs.com?from=positions_metrics&target={url}&mode=domains&limit=2&output=json&token={AHREF_API_KEY}'
    ahref_trafficcost = requests.get(trafficcost_requrl)
    # Traffic and cost are from the same request.
    if ahref_trafficcost.status_code!=200 or 'error' in str(ahref_trafficcost.content):
        rv['traffic'] = None
        rv['cost'] = None
    else:
        rv['traffic'] = ahref_trafficcost.content['metrics']['traffic']
        rv['cost'] = ahref_trafficcost.content['metrics']['cost']
    if rv['domain_authority'] != None or rv['traffic'] != None or rv['cost'] != None:
        return rv
    return None

