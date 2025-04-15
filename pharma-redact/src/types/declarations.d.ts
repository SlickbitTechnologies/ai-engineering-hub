declare module 'better-sqlite3' {
    interface DatabaseInstance {
        exec(sql: string): void;
        prepare(sql: string): Statement;
        transaction(fn: Function): Function;
        pragma(pragma: string, options?: { simple?: boolean }): any;
        checkpoint(databaseName?: string): void;
        function(name: string, functionDefinition: Function): void;
        aggregate(name: string, options: { start?: any, step: Function, result?: Function }): void;
        loadExtension(path: string): void;
        close(): void;
        defaultSafeIntegers(toggleState?: boolean): DatabaseInstance;
        open(): boolean;
    }

    interface Statement {
        run(...params: any[]): RunResult;
        get(...params: any[]): any;
        all(...params: any[]): any[];
        iterate(...params: any[]): IterableIterator<any>;
        pluck(toggleState?: boolean): Statement;
        expand(toggleState?: boolean): Statement;
        raw(toggleState?: boolean): Statement;
        bind(...params: any[]): Statement;
        columns(): ColumnDefinition[];
        safeIntegers(toggleState?: boolean): Statement;
    }

    interface RunResult {
        changes: number;
        lastInsertRowid: number | bigint;
    }

    interface ColumnDefinition {
        name: string;
        column: string | null;
        table: string | null;
        database: string | null;
        type: string | null;
    }

    interface Options {
        readonly?: boolean;
        fileMustExist?: boolean;
        timeout?: number;
        verbose?: Function;
    }

    interface DatabaseConstructor {
        new(filename: string, options?: Options): DatabaseInstance;
        (filename: string, options?: Options): DatabaseInstance;
    }

    const Database: DatabaseConstructor;
    export default Database;
} 