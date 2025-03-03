import { PasswordModal } from "./components/PasswordModal";
import { Message } from "./components/Message"
import { FlatList, TextInput, Button, View } from "react-native";
import { useState } from 'react';
import { MessageManager } from "./components/MessageManager"
//const RNFS = require('react-native-fs');

export default function App() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    
    const [messageManager, setMessageManager] = useState(
        // new MessageManager("amiko.zirk.eu", true)
        new MessageManager("localhost:5129", false, setMessages)
    )

    return (
        <View
        style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        }}
        >
            <PasswordModal callback={(pwd) => {messageManager.submitPassword(pwd)}}></PasswordModal>

            <FlatList
                data={messages}
                renderItem={({item}) => <Message date={item.date.toLocaleString()} name={item.name} message={item.message} />}
                keyExtractor={(item, _) => item.id}
            >
                
            </FlatList>

            <View style={{}}>
                <TextInput style={{
                    borderColor: 'black',
                    borderRadius: '1px',
                    borderWidth: '2px'
                }} onChangeText={setMessage}></TextInput>
                <Button title='Submit' onPress={() => {
                    messageManager.sendUserMessage(message);
                    setMessage("");
                }} />
            </View>
        </View>
    );
}