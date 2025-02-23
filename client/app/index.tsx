import { PasswordModal } from "@/components/PasswordModal";
import { Text, View } from "react-native";

export default function Index() {
    return (
        <View
        style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        }}
        >
            <PasswordModal callback={(pwd: string) => {console.log(pwd)}}></PasswordModal>
        </View>
    );
}
