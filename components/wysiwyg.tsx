import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

type Props = {
    parentCallback: Function
}

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => <p>Loading editor...</p>
});

function Wysiwyg(props: Props) {
    const [content, setContent] = useState("");
    const { parentCallback } = props;

    return (
        <div>
            <ReactQuill 
                placeholder="My name is John Doe, and I write many guest posts. I wanted to see ..."
                value={content} 
                onChange={(value) => {
                    setContent(value);
                    parentCallback(value);
                }}
                modules={modules}
                formats={formats}
                style={{height: '100px'}}
            />
        </div>
    );
}

// Specify which toolbar features you want enabled
export const modules = {
    toolbar: [
        [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
        [{size: []}],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, 
         {'indent': '-1'}, {'indent': '+1'}],
        ['link'],
        ['clean']                                         
    ],
};

export const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link'
];

export default Wysiwyg;
