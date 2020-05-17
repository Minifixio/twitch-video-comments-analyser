interface Error {
    name: string;
    status?: number;
    code: string;
    info: string;
}

export const NO_CLIENTID_ERROR: Error = {
    name: 'Not ClientID provided',
    code: 'No ClientID',
    info: 'You must provide a ClientID from your Twitch App'
}


