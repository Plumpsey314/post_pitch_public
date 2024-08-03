import streamlit as st
from emailWriter import write_email

st.title('Blog Email Generator')
st.write('You will save time, money, headaches. Upload a link, we write an entire flipin email for you. It\'s litterally that easy.')

text_link = st.text_input("Insert a link here")

if text_link:
    try:
        email = write_email(text_link)
        st.success("Successfully generated an email. Here is the context:\n\n" + email['context'])
        st.write("Address: " + email['email'])
        st.write("Subject: " + email['subject'])
        st.write(email['body'])
    except Exception as e:
        st.error("Could not write the email sorry. " + str(e))
        raise(e)