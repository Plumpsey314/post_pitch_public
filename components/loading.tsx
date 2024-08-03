import React, {useState, useEffect} from 'react'
import { Container, Card, ProgressBar, Spinner } from 'react-bootstrap'

import styles from '@/styles/components/Loading.module.scss'

function Loading() {
    const [dots, setDots] = useState('...')
    const [timerCount, setTimerCount] = useState<number>(10)
    const [triviaQuestion, setTriviaQuestion] = useState('')
    const [triviaChoices, setTriviaChoices] = useState([])
    const [correctChoice, setCorrectChoice] = useState('')
    const [progress, setProgress] = useState<number>(0)

    const trivia = [
        {
            "question": "When was the iPod released?",
            "choices": [
                "2000",
                "2001",
                "2003",
                "2005"
            ],
            "answer": "2001"
        },
        {
            "question": "What is the highest mountain west of the Prime meridian?",
            "choices": [
                "Mount Rainier",
                "Pico de Orbiza",
                "Mount Aconcagua",
                "Mount Denali"
            ],
            "answer": "Mount Aconcagua"
        },
        {
            "question": "Who is on the $50 Bill?",
            "choices": [
                "Ulysses S. Grant",
                "Abraham Lincoln",
                "Hercules Mulligan",
                "Teddy Roosevelt"
            ],
            "answer": "Ulysses S. Grant"
        },
        {
            "question": "Which of these elements are Halogens?",
            "choices": [
                "Ag (Argon)",
                "B (Boron)",
                "Cl (Chlorine)",
                "H (Hydrogen)"
            ],
            "answer": "Cl (Chlorine)"
        },
        {
            "question": "Who says this quote: \"Dogs look up to us. Cats look down on us. Pigs treat us as equals.\"",
            "choices": [
                "Albert Einstein",
                "Mel Brooks",
                "Winston Churchill",
                "Ronald Reagan"
            ],
            "answer": "Winston Churchill"
        },
        {
            "question": "Who painted 'The Starry Night'?",
            "choices": [
                "Pablo Picasso",
                "Vincent van Gogh",
                "Leonardo da Vinci",
                "Claude Monet"
            ],
            "answer": "Vincent van Gogh"
        },
        {
            "question": "What is the most common blood type in humans?",
            "choices": [
                "A positive",
                "B positive",
                "O positive",
                "AB positive"
            ],
            "answer": "O positive"
        },
        {
            "question": "What is the smallest state in the USA?",
            "choices": [
                "Delaware",
                "Hawaii",
                "Rhode Island",
                "Connecticut"
            ],
            "answer": "Rhode Island"
        },
        {
            "question": "What element is diamond made of?",
            "choices": [
                "Carbon",
                "Oxygen",
                "Silicon",
                "Hydrogen"
            ],
            "answer": "Carbon"
        },
        {
            "question": "What is the national flower of Japan?",
            "choices": [
                "Rose",
                "Tulip",
                "Cherry Blossom",
                "Lotus"
            ],
            "answer": "Cherry Blossom"
        },
        {
            "question": "What is the term for a word that is spelled and pronounced the same way backward?",
            "choices": [
                "Anagram",
                "Palindrome",
                "Antonym",
                "Homonym"
            ],
            "answer": "Palindrome"
        },
        {
            "question": "Which sea creature has three hearts?",
            "choices": [
                "Octopus",
                "Dolphin",
                "Sea Turtle",
                "Starfish"
            ],
            "answer": "Octopus"
        },
        {
            "question": "What was the name of the first artificial Earth satellite?",
            "choices": [
                "Apollo",
                "Sputnik",
                "Vostok",
                "Luna"
            ],
            "answer": "Sputnik"
        },
        {
            "question": "Which country has the most natural lakes?",
            "choices": [
                "Canada",
                "USA",
                "Sweden",
                "Russia"
            ],
            "answer": "Canada"
        },
        {
            "question": "What is the only bird known to fly backwards?",
            "choices": [
                "Eagle",
                "Hummingbird",
                "Ostrich",
                "Penguin"
            ],
            "answer": "Hummingbird"
        },
        {
            "question": "What is the square root of 256?",
            "choices": [
                "12",
                "14",
                "16",
                "18"
            ],
            "answer": "16"
        },
        {
            "question": "Which philosopher said 'I think therefore I am'?",
            "choices": [
                "Plato",
                "Aristotle",
                "Descartes",
                "Kant"
            ],
            "answer": "Descartes"
        },
        {
            "question": "What is the gestation period of an African elephant?",
            "choices": [
                "9 months",
                "12 months",
                "15 months",
                "22 months"
            ],
            "answer": "22 months"
        },
        {
            "question": "What is the largest moon in the Solar System?",
            "choices": [
                "Europa (Jupiter)",
                "Titan (Saturn)",
                "Ganymede (Jupiter)",
                "Triton (Neptune)"
            ],
            "answer": "Ganymede (Jupiter)"
        },
        {
            "question": "Who wrote the epic fantasy series 'The Wheel of Time'?",
            "choices": [
                "George R. R. Martin",
                "Robert Jordan",
                "J.R.R. Tolkien",
                "Brandon Sanderson"
            ],
            "answer": "Robert Jordan"
        },
        {
            "question": "What was the nationality of the physicist and chemist Marie Curie, who conducted pioneering research on radioactivity?",
            "choices": [
                "English",
                "American",
                "German",
                "Polish"
            ],
            "answer": "Polish"
        },
        {
            "question": "In the Greek mythos, who was the god of dreams?",
            "choices": [
                "Hypnos",
                "Thanatos",
                "Morpheus",
                "Eros"
            ],
            "answer": "Morpheus"
        },
        {
            "question": "What planet was Emperor Palpatine from in Star Wars?",
            "choices": [
                "Tatooine",
                "Bespin",
                "Coruscant",
                "Naboo"
            ],
            "answer": "Naboo"
        },
    ]

    useEffect(() => {
        let triviaQA = trivia[Math.floor(Math.random()*trivia.length)]
        setTriviaQuestion(triviaQA.question)
        setTriviaChoices(triviaQA.choices)
        setCorrectChoice(triviaQA.answer)
        let tempDots = dots
        let tempTimer = timerCount
        let countdown = 5
        let progressNum = 0
        const loadingIntv = setInterval(() => {
            if(tempDots=='...'){
                setDots('.')
                tempDots = '.'
            }else{
                setDots(tempDots+'.')
                tempDots = tempDots+'.'
            }
            if(tempTimer==0){
                countdown --;
                if(countdown==0){
                    tempTimer = 10
                    setTimerCount(10)
                    countdown = 5
                    triviaQA = trivia[Math.floor(Math.random()*trivia.length)]
                    setTriviaQuestion(triviaQA.question)
                    setTriviaChoices(triviaQA.choices)
                    setCorrectChoice(triviaQA.answer)
                }
            }else{
                setTimerCount(tempTimer-1)
                tempTimer--
            }
            const progressJump = Math.floor(Math.random()*30)-20
            if(progressJump > 0){
                progressNum += progressJump;
                if(progressNum > 99){
                    setProgress(99)
                }else{
                    setProgress(progressNum)
                }
            }
        }, 1000)
        return () => clearInterval(loadingIntv)
    }, [])

    return (
        <Container>
            <Card className="mx-auto" style={{ width: '80%', marginTop: '10%' }}>
                <Card.Body className="text-center">
                    <h2>
                        Loading
                        {dots}
                    </h2>
                    <ProgressBar now={progress} label={`${progress}%`} />

                    <h4 className="mt-4">While you wait, Let's play trivia!</h4>
                    <span>
                        {triviaQuestion + ' ' + timerCount}
                    </span>

                    <div className="mt-3 text-left">
                        {triviaChoices.map((choice, i) => (
                            <div
                                key={i}
                                className={
                                    timerCount === 0
                                        ? choice === correctChoice
                                            ? styles.correct_choice
                                            : styles.incorrect_choice
                                        : styles.trivia_question
                                }
                            >
                                {(i + 1).toString() + ': ' + choice}
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        </Container>
    )
}

export default Loading