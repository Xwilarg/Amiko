import { useState } from 'react';
import { Input } from '~/components/ui/input';
import { View, Modal, StyleSheet, Button } from 'react-native';

export function PasswordModal({callback}) {
    const [modalVisible, setModalVisible] = useState(true);
    const [password, setPassword] = useState("");
    return <Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}>
        <View style={styles.centeredView}>
            <Input style={styles.textInput} secureTextEntry={true} onChangeText={setPassword}></Input>
            <Button title='Submit' onPress={() => {
                setPassword("");
                callback(password);
                setModalVisible(false)
            }} />
        </View>
    </Modal>;
}

const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textInput: {
        borderColor: 'black',
        borderRadius: 1,
        borderWidth: 2
    }
});