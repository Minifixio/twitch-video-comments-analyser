# Twitch video comments analyser

Retreive and extract various informations from from Twitch VOD comments

Features :
- A **simplified** and **convenient** version of Twitch video comments
- Possibility to **choose the time range** of the video to analyse
- Get datas about **emoticons** used
- Sort comments according to the **number of comments sent by people**
- Parse the Twitch video by time range to **highlight the moments with the most comments**

<br>
<br>

# Installation

**NOT YET PUBLISHED**
```
npm install twitch-video-comments-analyser
```

<br>
<br>

# Usage

``` javascript
import { CommentAnalyser } from './CommentsAnalyser' // For TypeScript
let anaylser = require('twitch-video-comments-analyser') // For Javascript

// You have to add your own Client ID. The second parameter is to enable the verbose mode.
const anaylser = new CommentAnalyser('TWITCH_CLIENT_ID', true)

const run = async () => {

    // Retreive the comments and return an array of Comments (see the "patterns" section)
    const comments = await anaylser.getComments(619607685, 500, 800)

    // Return an array with the ID of each emoticon used and its number of occurences
    const emoticonsDatas = anaylser.emoticonStats(comments)

    // Return an array with the name of each commenter and their number of occurences
    const sortByUsers = anaylser.sortByUsers(comments)

    // Return an array with, for each time range, the number of comments sent
    const highlights = anaylser.sortByTimeRange(comments, 20) // 20 is the length of the time range with which the video will be analyzed

}

run().catch(error => console.log(error))

```

<br>
<br>


# Examples :
``` javascript
    let comments = await anaylser.getComments(619607685, 500, 800)
    console.log(comments)
    
    /** Returns :
        [
            {
                created_at: '2020-05-13T10:08:54.05Z',
                updated_at: '2020-05-13T10:08:54.05Z',
                time: 780.35,
                commenter: {
                    display_name: 'its_Weasel',
                    name: 'its_Weasel',
                    type: 'user',
                    bio: null,
                    logo: 'https://static-cdn.jtvnw.net/jtv_user_pictures/7e2e34f8-af57-4cb1-928e-d8107a7e8a17-profile_image-300x300.png'
                },
                message: {
                    message: 'I have AdBlockPlus, NoScript, uBlock Origin and DNS level ad server blocking LUL',
                    user_color: '#FF0000',
                    user_badges: [],
                    emoticons: [
                        {
                            id: 9
                            link: "https://static-cdn.jtvnw.net/emoticons/v1/9/1.0"
                        }
                    ]
                }
            },
            {
                created_at: '2020-05-13T10:09:09.643Z',
                updated_at: '2020-05-13T10:09:09.643Z',
                time: 795.943,
                commenter: {
                    display_name: 'vTz_iLewis_x',
                    name: 'vTz_iLewis_x',
                    type: 'user',
                    bio: 'WATP',
                    logo: 'https://static-cdn.jtvnw.net/jtv_user_pictures/7e2e34f8-af57-4cb1-928e-d8107a7e8a17-profile_image-300x300.png'
                },
                message: {
                    message: 'onsW1 onsW2 onsW3 onsW4',
                    user_color: "#00FF7F",
                    user_badges: [
                        {
                            id: "premium"
                            version: 1
                        }
                    ],
                    emoticons: []
                }
            }
            ...
        ]
    **/
    

    let usersSorted = anaylser.sortByUsers(comments)
    console.log(usersSorted)

    /** Returns :
        [
            { user: 'benschie', count: 5 },
            { user: 'n1trux', count: 5 },
            { user: 'Samir2061', count: 4 },
            { user: 'm_c__j', count: 4 },
            { user: 'Nigelyap', count: 3 },
            { user: 'Gwapple', count: 3 },
            { user: 'its_Weasel', count: 2 }
            ...
        ]    
    **/


    let highlights = anaylser.sortByTimeRange(comments)
    console.log(highlights)

    /** Returns :
        [
            { range: { start: 436.769, end: 456.769 }, count: 4 },
            { range: { start: 460.458, end: 480.458 }, count: 3 },
            { range: { start: 480.554, end: 500.554 }, count: 9 },
            { range: { start: 501.073, end: 521.073 }, count: 3 }
            ...
        ]    
    **/


    let emoticonStats = anaylser.emoticonStats(comments)
    console.log(emoticonStats)

    /** Returns :
        [
            {
                emoticonId: 86,
                count: 13,
                link: 'https://static-cdn.jtvnw.net/emoticons/v1/86/1.0'
            },
            {
                emoticonId: 11,
                count: 4,
                link: 'https://static-cdn.jtvnw.net/emoticons/v1/11/1.0'
            },
            {
                emoticonId: 15,
                count: 1,
                link: 'https://static-cdn.jtvnw.net/emoticons/v1/15/1.0'
            }
            ...
        ]    
    **/
```

<br>
<br>

# Patterns

## Comment

- **`created_at`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : ISO Date 
  - > *ex: "2020-05-12T19:30:55.704Z"*

- **`updated_at`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : ISO Date
  - > *ex: "2020-05-12T19:30:55.704Z"*

- **`time`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : Time in seconds of the comment
  - > *ex: 203*

- **`commenter`** *\<[Commenter](#commenter)\>* : The commenter

- **`message`** *\<[Message](#message)\>* : The main content of the comment

<br>

## Commenter
- **`display_name`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : The name displayed on the Twitch stream
  - > *ex: "felix"*

- **`name`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : The Twitch username of the commenter

- **`display_name`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : If the commenter is a BOT or a real user
  - > *ex: "user"*

- **`bio`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : The Twitch bio of the user
  - > *ex: "don't read me"*

- **`logo`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : A link to the commenter's avatar
  - > *ex: https://static-cdn.jtvnw.net/user-default-pictures-uv/dbdc9198-def8-11e9-8681-784f43822e80-profile_image-300x300.png*

<br>

## Message
- **`message`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : The content of the comment
  - > *ex: "hahahahhahahahhaha"*

- **`user_color`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : The color of the user in the chat (HEX)
  - > *ex: "#8A2BE2"*

- **`emoticons`** *Array\<[Emoticon](#emoticon)\>* 

- **`user_badges`** *Array\<[Badge](#badge)\>* 

<br>

## Emoticon
- **`id`** *\<[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)\>* : The ID of the comment
  - > *ex: 1566988*

- **`link`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : The link to the image of the emoticon
  - > *ex: https://static-cdn.jtvnw.net/emoticons/v1/1566988/1.0*

<br>

## Badge
- **`id`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : The ID of the badge
  - > *ex: "vip"*

- **`version`** *\<[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)\>* : The version of the badge
  - > *ex: 1*

<br>

## UserCountComment
- **`user`** *\<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)\>* : The name of the commenter
  - > *ex: "nas"*

- **`count`** *\<[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)\>* : The number of comments sent by the commenter
  - > *ex: 23*

<br>

## TimeRangeComment
- **`range`** *\<{start: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type), end: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)}\>* : The time range of analysis (in seconds)
  - > *ex: __{start: 278, end: 298}__ (if the time range is 20 seconds)*

- **`count`** *\<[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type)\>* : The number of comments sent during this period
  - > *ex: 109*

<br>
<br>

# Methods

- **`CommentAnalyser(TWITCH_CLIENT_ID, verbose=false)`**
    * `TWITCH_CLIENT_ID` : your Twitch Client ID from your Twitch App. See [this](https://dev.twitch.tv/console/apps/create)
    * `verbose`: enable the verbose mode. See [examples](#verbose-mode)

- **`getComments(videoId, start, end)`** *\<[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[Comment](#comment)\>\>\>*
    * `videoId` : The ID od the video from Twitch
        - > *ex: https://www.twitch.tv/videos/__619607685__*
    * `start`: The start of the extract (in seconds)
    * `end`: The end of the extract (in seconds)

    **Note** : If the time range is large, the process can be __long__

- **`sortByUsers(comments)`** *\<[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[UserCountComment](#usercountcomment)\>\>* in ascending order
    * `comment` : The array of comments from the `getComments()` method

- **`sortByTimeRange(comments)`** *\<[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)\<[TimeRangeComment](#timerangecomment)\>\>*
    * `comment` : The array of comments from the `getComments()` method

<br>
<br>

# Verbose mode 

Verbose mode adds some logs and also a progress bar in the console showing the progress in retrieving comments.

> ex : [======&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;] 50% of comments retrieved


