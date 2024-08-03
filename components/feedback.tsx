import React from 'react'
import { Row, Col} from 'react-bootstrap'
import { Widget } from '@typeform/embed-react'

type Props = {
    closeFunc: Function
}

function Feedback(props: Props) {
    const { closeFunc } = props

    const feedbackFormUrl = 'https://6fxw5tlp5ko.typeform.com/to/o8lEaEDJ'

    return (
        <Col style={{border: '1px solid #ddd', padding: '5px'}}>
            <Row>
                <div 
                    className='justify-content-end'
                    style={{display: 'flex'}}
                >
                    <span style={{cursor: 'pointer'}}onClick={() => {
                        closeFunc();
                    }}>x</span>
                </div>
            </Row>
            <Row className="justify-content-center text-center mt-5">
                <h2>
                    🎉🎉You just created your 300th email!🎉🎉
                </h2>
                <p>
                    We would love feedback on your experience so far. Thank you!
                </p>
            </Row>
            <Row>
                <Widget id={feedbackFormUrl} style={{ height: '500px' }} />
            </Row>
        </Col>
    )
}

export default Feedback
