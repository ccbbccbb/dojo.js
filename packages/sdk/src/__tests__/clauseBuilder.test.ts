import { describe, expect, it } from "vitest";
import { ClauseBuilder } from "../clauseBuilder";
import {
    ComparisonOperator,
    LogicalOperator,
    PatternMatching,
} from "@dojoengine/torii-client";
import { SchemaType } from "../types";

// Test models interface
interface TestModels extends SchemaType {
    dojo_starter: {
        Moves: {
            fieldOrder: string[];
            remaining: number;
            player: string;
        };
        Position: {
            fieldOrder: string[];
            x: number;
            y: number;
        };
        GameState: {
            fieldOrder: string[];
            active: boolean;
            score: number;
            gameId: string;
        };
    };
}

describe("ClauseBuilder", () => {
    describe("whereKeys", () => {
        it("should create a Keys clause with default pattern matching", () => {
            const builder = new ClauseBuilder<TestModels>();
            const clause = builder
                .keys(["dojo_starter-Moves"], ["player1"])
                .build();

            expect(clause).toEqual({
                Keys: {
                    keys: ["player1"],
                    pattern_matching: "VariableLen" as PatternMatching,
                    models: ["dojo_starter-Moves"],
                },
            });
        });

        it("should create a Keys clause with custom pattern matching", () => {
            const builder = new ClauseBuilder<TestModels>();
            const clause = builder
                .keys(["dojo_starter-Moves"], ["player1"], "VariableLen")
                .build();

            expect(clause).toEqual({
                Keys: {
                    keys: ["player1"],
                    pattern_matching: "VariableLen" as PatternMatching,
                    models: ["dojo_starter-Moves"],
                },
            });
        });
    });

    describe("where", () => {
        it("should create a Member clause with number value", () => {
            const builder = new ClauseBuilder<TestModels>();
            const clause = builder
                .where("dojo_starter-Moves", "remaining", "Gt", 10)
                .build();

            expect(clause).toEqual({
                Member: {
                    model: "dojo_starter-Moves",
                    member: "remaining",
                    operator: "Gt" as ComparisonOperator,
                    value: { Primitive: { U32: 10 } },
                },
            });
        });

        it("should create a Member clause with string value", () => {
            const builder = new ClauseBuilder<TestModels>();
            const clause = builder
                .where("dojo_starter-Moves", "player", "Eq", "player1")
                .build();

            expect(clause).toEqual({
                Member: {
                    model: "dojo_starter-Moves",
                    member: "player",
                    operator: "Eq" as ComparisonOperator,
                    value: { String: "player1" },
                },
            });
        });
    });

    describe("compose", () => {
        it("should create a composite OR then AND clause", () => {
            const clause = new ClauseBuilder<TestModels>()
                .compose()
                .or([
                    new ClauseBuilder<TestModels>().where(
                        "dojo_starter-Position",
                        "x",
                        "Gt",
                        0
                    ),
                    new ClauseBuilder<TestModels>().where(
                        "dojo_starter-Position",
                        "y",
                        "Gt",
                        0
                    ),
                ])
                .and([
                    new ClauseBuilder<TestModels>().where(
                        "dojo_starter-GameState",
                        "active",
                        "Eq",
                        true
                    ),
                ])
                .build();

            expect(clause).toEqual({
                Composite: {
                    operator: "And",
                    clauses: [
                        {
                            Member: {
                                model: "dojo_starter-GameState",
                                member: "active",
                                operator: "Eq" as ComparisonOperator,
                                value: { Primitive: { Bool: true } },
                            },
                        },
                        {
                            Composite: {
                                operator: "Or",
                                clauses: [
                                    {
                                        Member: {
                                            model: "dojo_starter-Position",
                                            member: "x",
                                            operator:
                                                "Gt" as ComparisonOperator,
                                            value: { Primitive: { U32: 0 } },
                                        },
                                    },
                                    {
                                        Member: {
                                            model: "dojo_starter-Position",
                                            member: "y",
                                            operator:
                                                "Gt" as ComparisonOperator,
                                            value: { Primitive: { U32: 0 } },
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            });
        });

        it("should handle single composite operation", () => {
            const builder = new ClauseBuilder<TestModels>();
            const clauseA = new ClauseBuilder<TestModels>().where(
                "dojo_starter-Position",
                "x",
                "Gt",
                0
            );
            const clauseB = new ClauseBuilder<TestModels>().where(
                "dojo_starter-Position",
                "y",
                "Gt",
                0
            );

            const clause = builder.compose().or([clauseA, clauseB]).build();

            expect(clause).toEqual({
                Composite: {
                    operator: "Or",
                    clauses: [
                        {
                            Member: {
                                model: "dojo_starter-Position",
                                member: "x",
                                operator: "Gt" as ComparisonOperator,
                                value: { Primitive: { U32: 0 } },
                            },
                        },
                        {
                            Member: {
                                model: "dojo_starter-Position",
                                member: "y",
                                operator: "Gt" as ComparisonOperator,
                                value: { Primitive: { U32: 0 } },
                            },
                        },
                    ],
                },
            });
        });
    });
});
