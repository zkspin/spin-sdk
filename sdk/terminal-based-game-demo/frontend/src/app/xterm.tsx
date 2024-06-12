"use client";

import React, { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import { Gameplay } from "./GamePlay";
// Import addons
// https://github.com/xtermjs/xterm.js
import { Terminal } from "@xterm/xterm";
const XTerm = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xterm = useRef<Terminal>();

    useEffect(() => {
        if (terminalRef.current) {
            const terminal = new Terminal();

            const game = new Gameplay();

            // const fitAddon = new FitAddon();
            // terminal.loadAddon(fitAddon);
            terminal.open(terminalRef.current);
            // fitAddon.fit();
            xterm.current = terminal;

            terminal.write("Hello from Spin\r\n");

            terminal.onKey((e) => {
                console.log("key", e.key);
            });

            let buffer: string = "";
            terminal.onData((data) => {
                if (data === "\r") {
                    console.log("Enter pressed");
                    terminal.writeln("\r");

                    const gameReturn = game.step(buffer);
                    terminal.writeln(gameReturn);
                    buffer = "";
                } else {
                    console.log("data", data);
                    terminal.write(data);
                    buffer += data;
                }
            });

            return () => {
                terminal.dispose();
            };
        }
    }, []);

    return <div ref={terminalRef} />;
};

export default XTerm;
