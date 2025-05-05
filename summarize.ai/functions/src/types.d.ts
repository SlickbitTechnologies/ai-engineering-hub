declare module 'firebase-functions' {
    namespace pubsub {
        function schedule(schedule: string): ScheduleBuilder;
    }

    interface ScheduleBuilder {
        timeZone(timeZone: string): ScheduleBuilder;
        onRun(handler: (context: any) => Promise<any> | any): CloudFunction<any>;
    }

    interface CloudFunction<T> { }

    const logger: {
        info: (message: string, ...args: any[]) => void;
        error: (message: string, ...args: any[]) => void;
        warn: (message: string, ...args: any[]) => void;
        debug: (message: string, ...args: any[]) => void;
    };
}

declare module 'firebase-admin' {
    interface App {
        firestore(): Firestore;
    }

    interface AppOptions { }

    function initializeApp(options?: AppOptions): App;

    const apps: App[] | null[];

    function firestore(): Firestore;

    interface Firestore {
        collection(path: string): CollectionReference;
        batch(): WriteBatch;
    }

    interface CollectionReference {
        get(): Promise<QuerySnapshot>;
    }

    interface QuerySnapshot {
        forEach(callback: (doc: QueryDocumentSnapshot) => void): void;
        size: number;
    }

    interface QueryDocumentSnapshot {
        ref: DocumentReference;
        data(): any;
    }

    interface DocumentReference {
        set(data: any, options?: any): Promise<WriteResult>;
        update(data: any): Promise<WriteResult>;
    }

    interface WriteBatch {
        update(docRef: DocumentReference, data: any): WriteBatch;
        commit(): Promise<WriteResult[]>;
    }

    interface WriteResult { }

    namespace firestore {
        type WriteResult = any;
        type QueryDocumentSnapshot = any;
    }
} 