import React, {useState, useEffect} from 'react'
import { Container, Form, Card, Button } from 'react-bootstrap'

import styles from '@/styles/components/SignInUp.module.scss'
import Space from '@/components/space'
import Logo from '@/components/logo'

type Props = {
    newAccount: boolean
    incorrectAuth: boolean
    parentCallback: Function
}

function SignIn(props: Props) {
    const { newAccount, incorrectAuth, parentCallback } = props

    const [passwordInp, setPasswordInp] = useState('')
    const [confirmPasswordInp, setConfirmPasswordInp] = useState('')
    const [passwordsMatch, setPasswordsMatch] = useState<boolean>(false)
    const [emailInp, setEmailInp] = useState('')
    const [isSignUp, setIsSignUp] = useState<boolean>(newAccount);
    const [wrongCredentials, setWrongCredentials] = useState<boolean>(true)

    return (
        <div>
            <Container className={styles.signInUp_container}>
                <Card>
                    <Card.Body>
                        <Logo/>
                        <h3 className="text-center mb-4">
                            {isSignUp?"Sign up to create your new account!":"Log into your existing account"}
                        </h3>
                        <Form onSubmit={(e) => {
                                    e.preventDefault()
                                    if(!isSignUp || passwordsMatch){
                                        parentCallback(isSignUp, emailInp, passwordInp)
                                    }
                        }}>
                            <span className={styles.error_message}>{incorrectAuth&&wrongCredentials?"Sorry, your email and password do not show up on our databae":''}</span>
                            <Space spaceSize={10}/>
                            <Form.Group controlId="email">
                                <Form.Label>{isSignUp?"Input your new email address.":"Enter your email address."}</Form.Label>
                                <Form.Control 
                                    type="email"
                                    value={emailInp}
                                    onChange={e => setEmailInp(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Space spaceSize={10}/>
                            <Form.Group controlId="password">
                                <Form.Label>Password</Form.Label>
                                <Form.Control 
                                    type="password"
                                    value={passwordInp}
                                    onChange={e => {
                                        setPasswordInp(e.target.value)
                                        setPasswordsMatch(e.target.value == confirmPasswordInp)
                                    }}
                                    required
                                />
                            </Form.Group>
                            {isSignUp?
                                <div>
                                    <Space spaceSize={10}/>
                                    <Form.Group controlId="confirmPassword">
                                        <Form.Label>Confirm Password</Form.Label>
                                        <Form.Control 
                                            type="password"
                                            value={confirmPasswordInp}
                                            onChange={e => {
                                                setConfirmPasswordInp(e.target.value)
                                                setPasswordsMatch(e.target.value == passwordInp)
                                            }}
                                            required
                                        />
                                    </Form.Group>
                                    {passwordsMatch||confirmPasswordInp==''?<></>:
                                        <span className={styles.error_message}>Passwords don't match</span>
                                    }
                                </div>
                            :<></>}
                            <Space spaceSize={20}/>
                            <Button className = "w-100" type="submit"> Log in </Button>
                        </Form>
                        <Space spaceSize={20}/>
                        {isSignUp?
                            <Button className="btn btn-secondary" onClick={(e) => {
                                e.preventDefault()
                                setIsSignUp(false)
                                setWrongCredentials(false)}}>
                                Have an account? Click here!
                            </Button>
                        : 
                            <Button className="btn btn-secondary"  onClick={(e) => {
                                e.preventDefault()
                                setIsSignUp(true)
                                setWrongCredentials(false)
                                setEmailInp('')
                                setPasswordInp('')}}>
                                Don't have an account? Create one here!
                            </Button>
                        }
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}

export default SignIn
