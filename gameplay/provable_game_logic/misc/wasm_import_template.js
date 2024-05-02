/* HELPER FOR IMPORT ZK-WASM */

let _print_buf = [];

function print_result() {
  // Convert the array of numbers to a string
  const result = String.fromCharCode(..._print_buf);

  _print_buf = [];

  console.log("Wasm_dbg_char result",result);
}

const __wbg_star0 = {
    abort: () => {
      console.error("abort in wasm!");
      throw new Error("Unsupported wasm api: abort");
    },
    require: (b) => {
      if (!b) {
        console.error("require failed");
        throw new Error("Require failed");
      }
    },
    wasm_dbg: (c) => {
      console.log("wasm_dbg", c);
    },
      /**
     * - Convert the number to a character
     * - Check if the character is a newline
     * - Print the accumulated result when encountering a newline
     * - Append the character to the print buffer
     */
    wasm_dbg_char: (data) =>
    String.fromCharCode(Number(data)) === "\n"
      ? print_result()
      : _print_buf.push(Number(data)),

    wasm_input: () => {
      console.error("wasm_input should not been called in non-zkwasm mode");
      throw new Error("Unsupported wasm api: wasm_input");
    },
    wasm_output: () => {
      console.error("wasm_input should not been called in non-zkwasm mode");
      throw new Error("Unsupported wasm api: wasm_input");
    },
    babyjubjub_sum_push: () => {
      console.error("baby_jubjub_sum_new");
      throw new Error("Unsupported wasm api: wasm_input");
    },
    babyjubjub_sum_finalize: () => {
      console.error("baby_jubjub_sum_new");
      throw new Error("Unsupported wasm api: wasm_input");
    },
}

/* AUTO GENERATED BELOW */

