import React, {useState, useRef, useEffect} from 'react'
import dynamic from 'next/dynamic';
import { Button, Form, Row, Col, Container } from 'react-bootstrap'
import 'react-quill/dist/quill.snow.css';
import 'bootstrap/dist/css/bootstrap.min.css'

import styles from '@/styles/pages/DiyWriter.module.scss';
import EmailSender  from '@/components/emailSender'
import Space from '@/components/space';
import { modules, formats } from '@/components/wysiwyg'

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading editor...</p>
});

function getLastAnchor(str) {
    const len = str.length
    const lastOpen = str.lastIndexOf('<');
    if(str[len-1] != '>' || lastOpen==-1){
        return [str, '']
    }
    return [str.substring(0,lastOpen), str.substring(lastOpen)]
}

function DiyWriter() {
    const [url, setUrl] = useState('')
    const [subjTemplate, setSubjTemplate] = useState('');
    const [bodyTemplate, setBodyTemplate] = useState('');

    const [loading, setLoading] = useState<Boolean>(false);
    const [emailObj, setEmailObj] = useState<any>(null)

    const words = ['author', 'company', 'email', 'first name', 'team name', 'title', 'title summary 1', 'title summary 2', 'url', 'very interesting'];

    function map_words(st, wordsDomain, image) {
        let rv = st;
        for(let i = 0; i < wordsDomain.length; i++){
            rv = rv.replaceAll("{{" + wordsDomain[i] + "}}", image[i]);
        }
        return rv;
    }

    async function handleSubmit() {
        if(url=='' || subjTemplate=='' || bodyTemplate==''){
            return
        }
        setLoading(true);
        const rawObject = await fetch(`https://postpitch-1689574641797.wl.r.appspot.com/object_data_lenient?url=${url}`)
            .then(response => response.json())
            .catch(error => {
                console.log(error);
                setLoading(false)
                alert("something went wrong " + error)
                return
            });
        if(!rawObject){
            //TODO: What do alerts do in iframes?
            setLoading(false)
            alert("something went wrong, and Post Pitch's request did not return anything.")
            return
        }
        const wordsImage = [rawObject.author, rawObject.company, rawObject.email, rawObject.author_first?rawObject.author_first:rawObject.team_name, rawObject.team_name, rawObject.title, rawObject.title_summaries[0], rawObject.title_summaries[1], rawObject.url, rawObject.very_interesting]
        const mappedSubj = map_words(subjTemplate, words, wordsImage);
        const mappedBody = map_words(bodyTemplate, words, wordsImage);
        setEmailObj({
            "url": url,
            "email": rawObject.email,
            "subject": mappedSubj,
            "body": mappedBody
        })
        setLoading(false)
    }

    return (
        <Container>
            <Form onSubmit={e => {
                e.preventDefault()
                handleSubmit()
            }}>
                <Space spaceSize={20}/>
                <Form.Group controlId='urlInput'>
                    <Form.Label><b>Insert a url here</b></Form.Label>
                    <Form.Control
                        as="textarea"
                        type="textarea"
                        placeholder='For Example, https://www.mashable.com/'
                        value = {url}
                        style = {{height: '50px'}}
                        onChange={e => setUrl(e.target.value)}
                    />
                </Form.Group>
                <Form.Group controlId='subjTemplate' className={`${styles.inp_wysiwyg} mx-auto`}>
                    <Form.Label><b>Subject</b></Form.Label>
                    <Row>
                        {words.map((word, i) => (
                            <Col className='col-2' key={i}>
                                <Button className='btn btn-light' style={{maxWidth: '150px'}} onClick={(e) => {
                                    e.preventDefault();
                                    const splitMarkup = getLastAnchor(subjTemplate);
                                    setSubjTemplate(splitMarkup[0] + '{{' + word + '}}' + splitMarkup[1]);
                                }}>
                                    {word}
                                </Button>
                            </Col>
                        ))}
                    </Row>
                    <Space spaceSize={10}/>
                    <Form.Control
                        as="textarea"
                        type="textarea"
                        placeholder='Great article on ...'
                        value = {subjTemplate}
                        style = {{height: '50px'}}
                        onChange={e => setSubjTemplate(e.target.value)}
                    />
                </Form.Group>
                <Form.Group controlId='bodyTemplate' className={`${styles.inp_wysiwyg} mx-auto`}>
                    <Form.Label><b>Body</b></Form.Label>
                    <Row>
                        {words.map((word, i) => (
                            <Col className='col-2' key={i}>
                                <Button className='btn btn-light' style={{maxWidth: '150px'}} onClick={(e) => {
                                    e.preventDefault();
                                    const splitMarkup = getLastAnchor(bodyTemplate);
                                    setBodyTemplate(splitMarkup[0] + '{{' + word + '}}' + splitMarkup[1]);
                                }}>
                                    {word}
                                </Button>
                            </Col>
                        ))}
                    </Row>
                    <div className={styles.text_input}>
                        {/*Not using WYSIWYG component for this; probably easier this way.*/}
                        <ReactQuill 
                            placeholder="My name is John Doe, and I write many guest posts. I wanted to see ..."
                            value={bodyTemplate} 
                            onChange={(value) => {
                                setBodyTemplate(value);
                            }}
                            modules={modules}
                            formats={formats}
                            style={{height: '100px'}}
                        />
                    </div>
                </Form.Group>
                <Button type="submit" onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}>Submit</Button>
            </Form>
            {loading?
                <span>Loading ... </span>
            :
                <div>
                    {emailObj==null?
                        <></>
                    :
                        <EmailSender email={emailObj} id={0} template='' approved={true} showURL={false}/>
                    }
                </div>
            }
        </Container>
    )
}

export default DiyWriter;