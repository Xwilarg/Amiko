import { PasswordModal } from "../components/PasswordModal";
import { Message } from "../components/Message"
import { FlatList, TextInput, Button, View, StyleSheet } from "react-native";
import { useState } from 'react';
import { MessageManager } from "../components/MessageManager"

export default function Index() {
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

            <View>
                <TextInput style={styles.textInput} onChangeText={setMessage} value={message}></TextInput>
                <Button title='Submit' onPress={() => {
                    messageManager.sendUserMessage(message);
                    setMessage("");
                }} />
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    textInput: {
        borderColor: 'black',
        borderRadius: 1,
        borderWidth: 2
    }
});