import React from 'react'

type Props = {
    spaceSize: number
}

function Space(props: Props){
    const {spaceSize} = props
    return (
        <div style={{padding: spaceSize+"px"}}></div>
    )
}

export default Space