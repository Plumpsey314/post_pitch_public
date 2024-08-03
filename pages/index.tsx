import React, {useState, useEffect} from 'react'
import { useRouter } from 'next/router'
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, DocumentReference, Timestamp } from 'firebase/firestore';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

import firebaseObj from '@/firebase';
import styles from '@/styles/pages/Index.module.scss';
import EmailSender from '@/components/emailSender';
import Loading from '@/components/loading';
import Space from '@/components/space'
import Logo from '@/components/logo'
import Wysiwyg from '@/components/wysiwyg'
import Feedback from '@/components/feedback'

function Index() {
    const [text, setText] = useState('');
    const [csvurls, setCsvurls] = useState([])
    const [template, setTemplate] = useState('');
    const [urls, setUrls] = useState([])
    const [loading, setLoading] = useState<boolean>(false)
    const [emails, setEmails] = useState<any>([])
    const [emailObjs, setEmailObjs] = useState([])
    const [askFeedback, setAskFeedback] = useState<boolean>(false)

    const [curUser, setCurUser] = useState<any>({})
    const [curUserRef, setCurUserRef] = useState<DocumentReference>(null);
    const [limitReached, setLimitReached] = useState<boolean>(false)

    const db = firebaseObj.db
    const router = useRouter();

    const sampleUrl = 'https://mashable.com'
    const sampleTemplate = `My name is Nathan Derhake, and I coded and co-founded a blogger outreach software called Post Pitch. I blog about guest post outreach and anything about building a profitable blog.<br/><br/>
    I wanted to talk about collaborating via writing a guest post on your site. Here are a couple of topics that might be good for your blog:<br/><br/>
    -The Best X Blogger Outreach Templates<br/>
    -The Best Guest Posting Tools 2024<br/>
    -Do You Get Paid For Guest Posting?<br/>
    -New Link Building Strategies 2024<br/><br/>
    Let me know what topics interest you, and then I can write an article!<br/><br/>
    -Nathan`

    useEffect(() => {
        if(router.isReady){
            const emailQueryParam = "youremail@example.com";
            const userRef = doc(db, 'users', emailQueryParam)
            if(!userRef){
                throw new Error("This user is not defined.")
            }
            setCurUserRef(userRef)
            getDoc(userRef).then((value) => {
                if(!value.exists()){
                    createUser(userRef, emailQueryParam)
                }else{
                    setCurUser(value.data())
                }
            })
            // This code redirects the user to post-pitch.com For this current application, I do not want to do that.
            // const emailQueryParam = router.query.email;
            // if (emailQueryParam && typeof emailQueryParam === 'string' && document.referrer=='https://www.post-pitch.com/') {
            // // if(typeof emailQueryParam =='string'){
            //     const userRef = doc(db, 'users', emailQueryParam)
            //     if(!userRef){
            //         throw new Error("This user is not defined.")
            //     }
            //     setCurUserRef(userRef)
            //     getDoc(userRef).then((value) => {
            //         if(!value.exists()){
            //             createUser(userRef, emailQueryParam)
            //         }else{
            //             setCurUser(value.data())
            //         }
            //     })
            // }else if(JSON.stringify(curUser) === '{}') {
            //     router.push("https://www.post-pitch.com/")
            // }
        }
    }, [router.isReady])

    /**
     * 
     * @param ref is the reference from the database. This is a document we will add in the
     * users category
     * @param userEmail is the email address of the person we will add.
     * 
     * This method creates a user (meaning adds it to firestore) then sets the data as the 
     * curUser session states 
     */
    function createUser(ref, userEmail){
        type UserData = {
            admin: boolean,
            emailsLeft: number,
            email: string,
            emailsCreated: number,
            emailsFailed: number,
            emailsSent: number,
            emailsApproved: number,
            emailsTimedOut: number,
            waitTime: number,
            expirationTime?: Timestamp, 
            startDate?: Timestamp
        }
        const now = Timestamp.now()

        const data: UserData = {
            "admin": false,
            "emailsLeft": 700,
            "email":userEmail,
            "emailsCreated": 0,
            "emailsFailed": 0,
            "emailsSent": 0,
            "emailsApproved": 0,
            "emailsTimedOut": 0,
            "waitTime": 120000,
            "expirationTime": new Timestamp(now.seconds + 1209600, 0),
            "startDate": now
        }
        // The setDoc is actually a firebase method not a react method.
        setDoc(ref, data)
        setCurUser(data)
    }

    function fetch_email_sender(url, timeout): Promise<any>{
        const generationPromise = fetch(`https://postpitch-1689574641797.wl.r.appspot.com/email_data_lenient?url=${url}`)
            .then(response => response.json())
            .catch(error => {
                console.log(error)
            });
    
        const emptyPromise = Promise.resolve({
            "context": "TIMEOUT",
            "email": "TIMEOUT",
            "subject": "TIMEOUT",
            "body": "TIMEOUT",
            "url": url
        });
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(emptyPromise);
            }, timeout);
        });
    
        return Promise.race([generationPromise, timeoutPromise]);
    }

    async function linksSubmited(){
        if(text != '' && csvurls.length >0 ){
            throw Error("Both text and a CSV file were submitted. Only submit one set of urls.")
        }
        let tempUrls = urls
        setLoading(true)
        const splitText = text.split('\n').join(' ').split(',').join(' ').split(' ')
        tempUrls = text=='' && csvurls.length>0? csvurls: splitText.filter((url) => {return url!=''})

        if(tempUrls.length==0){
            tempUrls=[sampleUrl]
        }
        setUrls(tempUrls)

        // Checking if urls are badly formated
        let alertedUser = false
        let urlsForBackend = []
        for(let i = 0; i < tempUrls.length; i++){
            const curLine = tempUrls[i].trim()
            const urlsInLine = curLine.includes(' ')?curLine.split(' '):[curLine]
            for(let j = 0; j < urlsInLine.length; j++){
                const curUrl = urlsInLine[j].trim()
                if(curUrl != ''){
                    if(curUrl.length > 100){
                        if(!alertedUser){
                            alert('I am sorry, but you are inputing the urls in the wrong format. You should seperate each url by a new line. Also, try to make the links you input a link to the main site page. (input https://www.example.com over https://www.example.com/example-page)')
                            alertedUser = true
                        }
                    }else{
                        urlsForBackend.push(curUrl)
                    }
                }
            }
        }
        if(urlsForBackend.length == 0){
            setLoading(false)
            return
        }
        // Firebase instances
        const docSnap = await getDoc(curUserRef)
        if (!docSnap.exists()) {
            throw Error("Database not found");
        }
        const user = docSnap.data();

        // All of this is firebase auth stuff I do not need to do.
        // // Checking to see if the user has enough emails
        // if(!user.admin){
        //     if (user.expirationTime) {
        //     if(user.expirationTime.toDate() < new Date()){
        //         console.log(new Date())
        //         console.log(user.expirationTime)
        //         user.emailsLeft = 0
        //     }
        //     if(urlsForBackend.length > user.emailsLeft){
        //         if(user.emailsLeft == 0){
        //             router.push("https://www.post-pitch.com/pricing")
        //             setLoading(false)
        //             return
        //         }
        //         setLimitReached(true)
        //         urlsForBackend = urlsForBackend.slice(0, user.emailsLeft)
        //     }
        // } else {
        //     // This line of code should never run.
        //     console.error("There is no expirationDate attribute for this user.")
        //     router.push("https://www.post-pitch.com/pricing")
        //     setLoading(false)
        //     return
        // }
        // }

        // Resetting session state variables.
        setText('')
        setCsvurls([])
        setEmailObjs([])
        // Setting up a way to asyncronously call all the email sending methods
        const waitTime = user.waitTime
        const reqs = urlsForBackend.map(url => fetch_email_sender(url, waitTime));
        let data: any

        // Actually calling the email sending methods
        try {
            data = await Promise.all(reqs);
        } catch (error) {
            throw Error("An error occurred", error);
        }

        // Filtering out the failure/error emails sent.
        let failCount = 0
        let successCount = 0
        let timeoutCount = 0
        const noErrorData = []
        for(let i = 0; i < data.length; i++){
            const cur = data[i]
            if(cur.context.includes("ERROR")){
                const errors = collection(curUserRef, 'errors')
                await addDoc(errors, {
                    "body": "ERROR",
                    "context": cur.context,
                    "email": "ERROR",
                    "subject": "ERROR",
                    "url": urlsForBackend[i]
                })
                failCount++;
            }else if(cur.body=="TIMEOUT"){
                const timeouts = collection(curUserRef, 'timeouts')
                await addDoc(timeouts, {
                    "url": urlsForBackend[i]
                })
                timeoutCount++;
            }else{
                noErrorData.push(data[i])
                const pitches = collection(curUserRef, 'pitches')
                await addDoc(pitches, {
                    "body": cur.body,
                    "context": cur.context,
                    "email": cur.email,
                    "subject": cur.subject,
                    "url": urlsForBackend[i]
                })
                successCount++;
                // While I am at it, I will check if the url has HTTP in it
                // TODO: make this done in the backend.
                if(!cur.url.includes('http')){
                    cur.url = 'https://' + cur.url
                }
                // Also, I want to add code to make a new line in the form of a break character in the body.
                // TODO: Also I want to move this to the back end
                let newBody = cur.body
                const newLineStart = newBody.indexOf('I loved')
                const brStr = '<br/><br/>'
                newBody = newBody.substring(0, newLineStart-1) + brStr + newBody.substring(newLineStart) + brStr
                cur.body = newBody
            }
        }
        updateDoc(curUserRef, {
            "emailsCreated": user.emailsCreated + successCount,
            "emailsFailed": user.emailsFailed + failCount,
            "emailsTimedOut": user.emailsTimedOut + timeoutCount,
            "emailsLeft": user.admin?user.emailsLeft:user.emailsLeft - successCount
        })
        const feedbackThreshold = 300
        // not asking for feedback now.
        // if(user.emailsCreated < feedbackThreshold && user.emailsCreated + successCount >= feedbackThreshold){
        //     setAskFeedback(true)
        // }

        // We only want to set the emails to be entries with no error/timeouts
        setEmails(noErrorData.length == 0?["NO EMAILS"]:noErrorData)
        setLoading(false)        
        if(template==''){
            setTemplate(sampleTemplate)
        }
    }

    async function handleCallback(emailObj, toAdd, objID){
        const filteredArr = emailObjs.filter(obj => obj.id!=objID)
        if(toAdd){ filteredArr.push({"emailObj": emailObj, "id": objID})}
        setEmailObjs(filteredArr)
    }

    async function prepareUserApprovedEmails(){
        setEmails([])
    }

    async function clearData(){
        setText('');
        setCsvurls([]);
        setTemplate('');
        setUrls([]);
        setLoading(false);
        setEmails([]);
        setEmailObjs([]);
        setAskFeedback(false)
    }

    async function handleFileUpload(event){
        const file = event.target.files[0];
        if(!file){
            setCsvurls([]);
            return;
        }
        const reader = new FileReader();
        reader.onload = function (event) {
          const csvData = event.target.result.toString();
          const csvUrls = csvData.split("\n"); // Assuming each URL is on a new line
          setCsvurls(csvUrls);
        };
        reader.readAsText(file);
    }

    // '\\n\\nMy name is Zach Derhake, and I write many guest posts. Here\'s a sample of my most recent work: https://www.corpus-aesthetics.com/fitness/exploring-the-science-do-compound-exercises-increase-testosterone\\n\\nI blog about ways men can increase their testosterone in natural ways. I have in-depth knowledge about testosterone and the men\'s health space.\\n\\nI wanted to see if we could talk about collaborating via link exchange and/or contributing to a guest post on the Turek Clinic Blog.\\n\\nLet me know what you think.\\n\\n-Zach Derhake
    return (
        <div style={{backgroundColor: '#148aff', minHeight: '100vh'}}>
            <Space spaceSize={10}/>
            <Container style={{backgroundColor: 'white'}}>
                <Space spaceSize={20}/>
                <Row>
                    <Col className='col-8'><Logo/></Col>
                    <Col className="col-4 d-flex justify-content-end align-items-center">
                        <Button className='btn btn-secondary' style={{height: '40px', padding: '0 12px'}} onClick={(e) => {
                            e.preventDefault()
                            clearData()
                        }}>Home</Button>
                        {/* <Space spaceSize={10}/>
                        <Button className='btn btn-secondary' style={{height: '40px', padding: '0 12px'}} onClick={(e) => {
                            e.preventDefault()
                        }}>Profile Information</Button> */}
                    </Col>
                </Row>
                {loading?
                    <Loading/>
                :
                    <div>
                        {emails.length==0?
                            <div>
                                {emailObjs.length==0?
                                    <div>
                                        <Row className="justify-content-center text-center mt-5">
                                            <h1>Welcome to PostPitch's Blog Email Generator</h1>
                                        </Row>
                                        <Row className="justify-content-center text-center mt-2">
                                            <p> Upload the url of a blog site and we will write a personalized email for you in less than a minute.</p>
                                        </Row>
                                        <Form onSubmit ={
                                            e => {
                                                e.preventDefault()
                                                linksSubmited()
                                            }
                                        }>
                                            <div className="d-flex flex-column align-items-center">
                                                <Form.Group controlId='textLinks' className={`${styles.formGroupDistinct} mx-auto`}>
                                                    <Form.Label>Insert your links here</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        type="textarea"
                                                        placeholder='For Example, https://www.mashable.com/'
                                                        value = {text}
                                                        style = {{height: '150px'}}
                                                        onChange={e => setText(e.target.value)}
                                                        className={styles.textInput}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId='csvLinks' className={`${styles.formGroupDistinct} mx-auto`}>
                                                    <Form.Label>Or Upload a CSV file with the URLs</Form.Label>
                                                    <Form.Control
                                                        type="file"
                                                        accept=".csv"
                                                        onChange={handleFileUpload}
                                                        className={styles.fileInput}
                                                    />
                                                </Form.Group>
                                                <Form.Group controlId='template' className={`${styles.formGroupDistinct} mx-auto`}>
                                                    <Form.Label>This is where you write the static part of your template</Form.Label>
                                                    <div className={styles.text_input}>
                                                        <Wysiwyg parentCallback={setTemplate}/>
                                                    </div>
                                                </Form.Group>
                                                <Button type="submit" className={`${styles.submitButton} mx-auto`}>
                                                    {template=='' || template=='<p><br></p>'?
                                                        <span>
                                                            {text=='' && csvurls.length==0?
                                                                "Submit with Default Template and URL"
                                                            :
                                                                "Submit with Default Template"
                                                            }
                                                        </span>
                                                    :
                                                        <span>
                                                            {text=='' && csvurls.length==0?
                                                                "Submit with Default URL"
                                                            :
                                                                "Submit"
                                                            }
                                                        </span>
                                                    }
                                                </Button>
                                            </div>
                                        </Form>
                                    </div>
                                :
                                    emailObjs.map((obj, i) => (
                                        <div key={i} className={styles.oneEmailContainer}>
                                            <EmailSender email={obj.emailObj} id={obj.id} template={template} approved={true} showURL={true}/>
                                        </div>
                                    ))
                                }
                            </div>
                        :
                            <div>
                                {askFeedback?
                                    <Feedback closeFunc={() => {
                                        setAskFeedback(false)
                                    }}/>
                                :
                                    <Form className="d-flex flex-column align-items-center" onSubmit={e => {
                                        e.preventDefault();
                                        prepareUserApprovedEmails();
                                    }}>
                                        {emails.map((em, i) => (
                                            <div key={i} className="my-2">
                                                {em=="NO EMAILS" ?
                                                        <Alert variant="warning">The URL(s) you entered could not result in an email being written. Try to use more popular blog sites (e.g. mashable.com or treehugger.com).</Alert>
                                                    :
                                            <EmailSender email={em} id={i} template={template} approved={false} showURL={true} parentCallback={handleCallback} />
                                                }
                                            </div>
                                        ))}
                                        {limitReached ?
                                            <Alert variant="warning" className="w-75 text-center mt-3">
                                                You have reached your subscription limit, so the whole list did not load. You are not charged for the emails that have resulted in errors, so you may still be able to enter more emails.
                                            </Alert>
                                        :
                                            null
                                        }
                                        <Button variant="secondary" type="submit" className="mt-3"> Show me the Emails I approved, or approve no emails and click this button to return to typing new links</Button>
                                    </Form>
                                }
                            </div>
                        }
                    </div>
                }
                <Space spaceSize={30}/>
            </Container>
            <Space spaceSize={10}/>
        </div>
    )
}

export default Index
