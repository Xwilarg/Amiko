import { useState } from 'react';
import { View, Modal, StyleSheet, Button, TextInput } from 'react-native';

export function PasswordModal({callback}) {
    const [modalVisible, setModalVisible] = useState(true);
    const [password, setPassword] = useState("");
    return <Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}>
        <View style={styles.centeredView}>
            <TextInput secureTextEntry={true} onChangeText={setPassword}></TextInput>
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
    }
});