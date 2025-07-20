export default class NetworkSession
{
    instance: string;
    token: string;

    constructor(instance: string, token: string)
    {
        this.instance = instance;
        this.token = token;
    }
}