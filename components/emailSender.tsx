import React, {useState, useRef} from 'react'
import { Row, Col, Alert, Button } from 'react-bootstrap'
import DOMPurify from "dompurify";

import styles from '@/styles/components/EmailSender.module.scss';
import Copy from '@/components/copy'

type Props = {
    email: any
    id: number
    template: string
    approved: boolean
    showURL: boolean
    parentCallback?: Function
  };

function EmailSender(props: Props){
    const {email, id, template, approved, showURL, parentCallback} = props

    const [looksGood, setLooksGood] = useState<boolean>(approved? approved: false)

    const bodyRef = useRef(null);

    function replaceInstance(inThis, ofThis, withThis){
        let str = inThis
        while(str.includes(ofThis)){
            str = str.replace(ofThis, withThis)
        }
        return str
    }

    function filterURL(str){
        let readyStr = str
        const illegalPhrases = ['<br/>']
        const replacePhrases = ['%0D%0A']
        for(let i = 0; i < illegalPhrases.length; i++){
            readyStr = replaceInstance(readyStr, illegalPhrases[i], replacePhrases[i])
        }
        const illegalChars = [' ']
        const replacements = ['%20']
        let rv = ''
        for(const char of readyStr){
            let wasIllegal = false
            for(let i = 0; i < illegalChars.length; i++){
                if(char==illegalChars[i]){
                    rv += replacements[i]
                    wasIllegal = true
                }
            }
            if(!wasIllegal){
                rv += char
            }
        }
        return rv
    }

    /**
     * 
     * @returns the value that will be coppied to clipboard
     */
    function handleCopyClick(){
        if (bodyRef.current) {
          // Get the inner HTML content from the WYSIWYG editor
          return bodyRef.current.innerText;
        }
        return email.body
    };

    async function updateLooksGood(){
        if(parentCallback){
            parentCallback(email, !looksGood, id)
            setLooksGood(!looksGood)
        }
    }

    type DisplayEmailContentProps = {
        htmlContent: string;
    };

    const DisplayEmailContent: React.FC<DisplayEmailContentProps> = ({ htmlContent }) => {
        //TODO = Change away from dom event
        const cleanContent = DOMPurify.sanitize(htmlContent);
        if(htmlContent.includes("<script>")){
            // Risk of malware.
            return <div></div>
        }
        return (
            <div dangerouslySetInnerHTML={{ __html: cleanContent }}></div>
        );
    }

    return (
        <div>
            {email.body==''?
                <></>
                // <Alert variant="warning">The URL(s) you entered could not result in an email being written. Try to use more popular blog sites (e.g. mashable.com or lifehacker.com).</Alert>
            :
                <Row className={styles.oneEmailContainer}>
                    <Col className="col-10" style={{padding: 0, minHeight: "150px"}}>
                        <div className={styles.outline_box} style={{justifyContent: 'center'}}>
                            {showURL
                            ?
                                <a href={email.url} target="_blank" rel="noopener noreferrer">
                                    <strong>{email.url}</strong>
                                </a>
                            :
                                <strong>{email.url}</strong>
                            }
                        </div>
                        <div className={styles.outline_box}>
                            <span>to: <strong>{email.email}</strong></span>
                            <Copy strToCopy={email.email} width='20px'/>
                        </div>
                        <div className={styles.outline_box}>
                            <strong>{email.subject}</strong>
                            <Copy strToCopy={email.subject} width='20px'/>
                        </div>
                        <div className={styles.outline_box}>
                            <div ref={bodyRef}>
                                <DisplayEmailContent htmlContent={email.body + template} />
                            </div>
                            <Copy strToCopy={email.body + template} parentCallback={handleCopyClick} width='20px'/>
                        </div>
                    </Col>
                    <Col className="col-2 d-flex justify-content-end align-items-start" style={{padding: 0}}>
                        {approved? 
                            <div className={styles.padded_message}>Sending emails directly through this Demo is not available at this time.</div>
                        :
                            <Button
                                className={`btn ${styles.lg_btn} ${looksGood ? "btn-success" : "btn-light"} mt-2 mr-2`}
                                onClick={e => {
                                    e.preventDefault()
                                    updateLooksGood()
                                }}
                            >
                                {looksGood ? "Looks Good!" : "Looks Good?"}
                            </Button>
                        }
                    </Col>
                </Row>
            }
        </div>
    )
}

export default EmailSender