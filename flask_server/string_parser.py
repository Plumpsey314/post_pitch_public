import unicodedata

def parse_num_list(string):
    o_list = []
    num_to_split = 1
    str_to_split = str(num_to_split)+'.'
    if str_to_split in string: string = ''.join(string.split(str_to_split)[1:])
    while(string != ''):
        num_to_split += 1
        str_to_split = str(num_to_split)+'.'
        if str_to_split in string:
            split_str = string.split(str_to_split)
            o_list.append(custom_trim(split_str[0]))
            string = ''.join(split_str[1:])
        else:
            o_list.append(custom_trim(string))
            string = ''
    return o_list

def custom_trim(string, trim_alphabet=' "\'', cut_alphabet = '\xa0\r\t\n'):
    rv = ''
    temp = ''
    cut_streak = ''
    for char in string:
        if char in trim_alphabet:
            temp +=char
            cut_streak = ''
        elif char in cut_alphabet:
            if not cut_streak: rv += ' '
            cut_streak += char
        else:
            cut_streak = ''
            if rv: rv += temp
            temp = ''
            rv += char
    return rv

# standardizing url format. Temporary code may change
def parse_url(url):
    # first triming it so it's the home url
    slash_split = url.split('/')
    # A url is either https://website.com/
    # website.com/
    # where the / at the end is optional
    # https://website.com/otherpage
    # website.com/otherpage
    # the first 2 are the formats we like, and nomatter what slash_split[1] is ''
    # and so is slash_split[3] if it is defined.
    if len(slash_split) >= 2:
        if slash_split[1] != '':
            url = slash_split[0]
        elif len(slash_split) >= 4:
            if slash_split[3] != '':
                url = '/'.join(slash_split[:3])
    before_url1 = ''
    before_url2 = ''
    after_url = ''
    if url[0:8] != 'https://' and url[0:7] != 'http://':
        before_url2 = 'https://'
        before_url1=before_url2
        if 'www' not in url:
            before_url2 += 'www.'
    if url[-1] != '/':
        after_url='/'
    rv= [before_url1+url+after_url, before_url2+url+after_url]
    return rv

def get_company(url):
    if 'www' in url: return custom_trim('.'.join(url.split('.')[1:]), trim_alphabet=' .,"\'/\\')
    return custom_trim(url.split('//')[-1], trim_alphabet=' .,"\'/\\')

def filter_not_utf8(string):
    return ''.join(c for c in string if unicodedata.category(c) != 'Cn')
