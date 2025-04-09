// Represent an user on the application
export default interface User
{
    // Unique identifier of the user
    id: number;

    // Display name of the user
    username: string;

    // Display colors for the user profile picture
    color: Color;

    // Character shown on the user profile picture
    character: string;
}

export interface Color
{
    r: number;
    g: number;
    b: number;
}