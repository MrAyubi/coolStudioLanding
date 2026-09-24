import { gifs } from "./image"



let players_select_data = {
    mamareza: {
        name: "MAMAREZA",
        skills: [
            { name: 'CODING', score: 2 },
            { name: 'multitasking', score: 3 },
            { name: 'NEGOTIATION', score: 2 },
            { name: 'descipline', score: 1 },
            { name: 'CREATIVITY', score: 3 }
        ],
        bio: "Think you don't need our services?<br/>He'll prove you wrong.<br/>And he built this website too.",
        gif: gifs.mamarezaGif
    },
    nima: {
        name: "NIMA",
        skills: [
            { name: 'CRITICAL THINKING', score: 2 },
            { name: 'STORY TELLING', score: 2 },
            { name: 'NAGGING', score: 3 },
            { name: 'FOCUS', score: 1 },
            { name: 'CREATIVITY', score: 3 }
        ],
        bio: "The Thinker. Questions everything, solves the unsolvable, and occasionally glitches reality for fun.",
        gif: gifs.nimaGif
    },
    asma: {
        name: "ASMA",
        skills: [
            { name: 'organising', score: 3 },
            { name: 'sentimentalism', score: 3 },
            { name: 'swimming', score: 1 },
            { name: 'biking', score: 3 },
            { name: 'imagination', score: 3 }
        ],
        bio: "Don’t mess with this girl. She can ruin your life with one tweet or bless it forever.",
        gif: gifs.asmaGif
    },
    moheb: {
        name: "MOHEB",
        skills: [
            { name: 'Framing', score: 3 },
            { name: 'Scissor skills', score: 3 },
            { name: 'using a stabiliser', score: 1 },
            { name: 'lighting', score: 2 },
            { name: 'focus', score: 3 }
        ],
        bio: "He has a samurai within.<br/>Every shot is a discipline. Every frame, a strike.And yes he carries a katana.",
        gif: gifs.mohebGif
    },
    amin: {
        name: "AMIN",
        skills: [
            { name: 'Directing', score: 3 },
            { name: 'Technical Skills', score: 2 },
            { name: 'Anthropology', score: 3 },
            { name: 'Punching', score: 3 },
            { name: 'Politeness', score: 1 }
        ],
        bio: "Amin bio . This will stop working in the next major version of npm..",
        gif: gifs.aminGif
    }

}



export { players_select_data }