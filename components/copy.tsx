import React, {useState, useEffect} from 'react';

import styles from '@/styles/components/Copy.module.scss'

type Props = {
    strToCopy: string
    parentCallback?: Function
    width?: string
    height?: string
}

/**
 * Using one of the width or height properties is recommended
 */
function Copy(props: Props) {
    const { strToCopy, parentCallback, width, height } = props;
    
    let styleObj = {}
    if (width) {
        styleObj = { width: width };
    } else if (height) {
        styleObj = { height: height };
    }

    const [showTooltip, setShowTooltipd] = useState<boolean>(false)
    const [coppiedMsg, setCoppiedMsg] = useState('d')

    async function handleCopyClick(){
        let content = strToCopy
        if(parentCallback){
            content = parentCallback()
        }
        navigator.clipboard.writeText(content).then(() => {
            setCoppiedMsg("Copied to clipboard!")
            setShowTooltipd(true);
            setTimeout(() => setShowTooltipd(false), 2000);
        }).catch((err) => {
            let errPreview = err.toString()
            if(errPreview.length > 20){
                errPreview = errPreview.substring(0,15) + '...'
            }
            setCoppiedMsg('Could not copy text: ' + errPreview)
            setShowTooltipd(true);
            setTimeout(() => setShowTooltipd(false), 2000);
            console.error('Could not copy text: ', err);
        });
    }

    return (
        <div className={styles.copy_container}>
            <img src='/images/icons/copy-icon.svg' style={styleObj} id={styles.black_copy}/>
            <img src='/images/icons/copy-icon-blue.svg' style={styleObj} id={styles.blue_copy} onClick={handleCopyClick} />
            {showTooltip && <div className={styles.tooltip}>{coppiedMsg}</div>}
        </div>
    );
}

export default Copy;
