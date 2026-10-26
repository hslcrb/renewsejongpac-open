export interface Program {
    id: string;
    title: string;
    category?: string;
    genre?: string;
    venue?: string;
    start?: string;
    end?: string;
    poster?: string;
    image?: string;
    imageAlt?: string;
    price?: number | string | null;
    times?: string[];
    sourceState?: "verified" | "unverified";
    bookingEnabled?: boolean;
    revision?: number;
    target?: string;
    time?: string;
    runningTime?: string;
    intermission?: string;
    ageLimit?: string;
    inquiry?: string;
    organizer?: string;
    sponsor?: string;
    description?: string;
    tags?: string[];
    schedule?: string[];
    highlights?: string[];
    [key: string]: any;
}

export interface Venue {
    id: string;
    name: string;
    kind?: string;
    capacity: number | string;
    description: string;
    location?: string;
    features?: string[];
    image?: string;
}

export interface Notice {
    id: string;
    title: string;
    date: string;
    category: string;
    views?: number;
    important?: boolean;
    content?: string;
    body?: string;
    pinned?: boolean;
    details?: [string, string][];
}

export interface NavItem {
    id: string;
    title: string;
    path: string;
    items: [string, string][];
}

export interface PageMeta {
    path: string;
    title: string;
    group: string;
    description: string;
    type: string;
    eyebrow: string;
}

export interface FigmaPrimitiveToken {
    name: string;
    hex: string;
    role?: string;
    origin: string;
    title?: string;
    desc: string;
    sample?: string;
    ink?: string;
    [key: string]: any;
}

export interface FigmaSemanticToken {
    group?: string;
    collection?: string;
    name: string;
    alias?: string;
    primitiveRef?: string;
    hex: string;
    usage: string;
    [key: string]: any;
}

export interface UserProfile {
    name: string;
    email: string;
    phone: string;
}

export interface BookingRecord {
    id: string;
    programId: string;
    title: string;
    date: string;
    time: string;
    venue: string;
    seats: string[];
    quantity?: number;
    total: number;
    reference: string;
    createdAt?: string;
}
