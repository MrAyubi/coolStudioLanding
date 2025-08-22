import { images } from "./image"
import { gifs } from "./image"


let players_data = [
    {
        name: "Mamareza",
        title: "Salesman Guy",
        image: gifs.mamarezaGif,
        bio: "Think you don't need our services?<br/>He'll prove you wrong.<br/>And he built this website too."
    },
    {
        name: "Asma",
        title: "Queen Of Vibe Tweets",
        image: gifs.nimaGif,
        bio: "She can make a retweet feel like a VIP pass.<br/>She makes agreeing with you the coolest trend of the day."
    }, {
        name: "Nima",
        title: "Social Media Queen",
        image: gifs.mamadGif,
        bio: "Think you don't need our services?<br/>He'll prove you wrong.<br/>And he built this website too."
    }, {
        name: "Nima",
        title: "Social Media Queen",
        image: gifs.asmaGif,
        bio: "Think you don't need our services?<br/>He'll prove you wrong.<br/>And he built this website too."
    }
]

let players_select_data = {
    mamareza: {
        name: "MAMAREZA",
        skills: [
            { name: 'CODING', score: 3 },
            { name: 'COOKING', score: 3 },
            { name: 'NEGOTIATION', score: 3 },
            { name: 'VIDEO EDDIT', score: 3 },
            { name: 'CREATIVITY', score: 3 }
        ],
        bio: "Think you don't need our services?<br/>He'll prove you wrong.<br/>And he built this website too.",
        gif: gifs.mamarezaGif
    },
    nima: {
        name: "NIMA",
        skills: [
            { name: 'nimaskill1', score: 2 },
            { name: 'nimaskill2', score: 2 },
            { name: 'nimaskill3', score: 3 },
            { name: 'nimaskill4', score: 2 },
            { name: 'nimaskill5', score: 3 }
        ],
        bio: "NIMA BIO Unknown user config. This will stop working in the next major version of npm.",
        gif: gifs.nimaGif
    },
    asma: {
        name: "ASMA",
        skills: [
            { name: 'asmaskill1', score: 1 },
            { name: 'asmaskill2', score: 3 },
            { name: 'asmaskill3', score: 1 },
            { name: 'asmaskill4', score: 3 },
            { name: 'asmaskill5', score: 1 }
        ],
        bio: "asma bio Unknown user config . This will stop working in the next major version of npm.",
        gif: gifs.asmaGif
    },
    moheb: {
        name: "MOHEB",
        skills: [
            { name: 'MOHEBskill', score: 1 },
            { name: 'MOHEBskill2', score: 2 },
            { name: 'MOHEBskill3', score: 3 },
            { name: 'MOHEBskill4', score: 2},
            { name: 'MOHEBskill5', score: 1 }
        ],
        bio: "MOHEb bio . This will stop working in the next major version of npm..",
        gif: gifs.mohebGif
    }

}

export { players_data, players_select_data }