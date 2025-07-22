export default function MessageForm() {
    return (
    <div className="container message is-flex-grow-0">
        <div className="is-flex">
            <div className="pfp"></div>
            <div className="message-main">
                <small className="date"></small>
                <h2 className="subtitle"></h2>
                <p className="content"></p>
                <div className="rich-preview is-flex is-hidden"></div>
                <div className="attachment-info is-hidden"></div>
            </div>
        </div>
    </div>
    )
}