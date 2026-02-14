export interface Flower {
    id: string;
    name: string;
    story: string;
    personality: string;
    imageUrl: string;
    meaning: string;
}

import flowersData from "./flowers_data.json";

export interface Flower {
    id: string;
    name: string;
    story: string;
    personality: string;
    imageUrl: string;
    meaning: string;
}

export const flowers: Flower[] = flowersData.map((flower) => ({
    id: flower.id,
    name: flower.name,
    story: flower.story,
    personality: flower.personality,
    imageUrl: flower.image_url,
    meaning: flower.meaning,
}));
