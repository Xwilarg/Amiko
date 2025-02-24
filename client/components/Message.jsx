import { View, StyleSheet, Text } from 'react-native';

export function Message({date, name, message}) {
    return <View>
        <Text>{date}</Text>
        <Text>{name}</Text>
        <Text>{message}</Text>
    </View>;
}

const styles = StyleSheet.create({
});