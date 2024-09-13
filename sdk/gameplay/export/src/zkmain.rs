use provable_game_logic::spin::SpinGame;
use provable_game_logic::spin::SpinGameTrait;
use provable_game_logic::definition::STATE_SIZE;
use provable_game_logic::hasher::hash_vec;
use wasm_bindgen::prelude::*;
use zkwasm_rust_sdk::wasm_input;
use zkwasm_rust_sdk::wasm_output;
use zkwasm_rust_sdk::require;
/*
    PUBLIC INPUTS marked by `wasm_input`: e.g wasm_input(0) specifies a public input of type u64
    PRIVATE INPUTS marked by `wasm_input`: e.g wasm_input(0) specifies a priva  te input of type u64
    PUBLIC OUTPUTS marked by `wasm_output`: e.g wasm_output(var) specifies an output `var` of type u64
*/
#[wasm_bindgen]
pub fn zkmain() -> i64 {
    // public Input: hash META transaction data
    let segment_meta_hash_0: u64 = unsafe { wasm_input(1) };
    let segment_meta_hash_1: u64 = unsafe { wasm_input(1) };
    let segment_meta_hash_2: u64 = unsafe { wasm_input(1) };
    let segment_meta_hash_3: u64 = unsafe { wasm_input(1) };

    // --- META transaction data ---
    let game_id: u64 = unsafe { wasm_input(0) };

    zkwasm_rust_sdk::dbg!("META: gameId: {}\n", game_id);

    // --- GAME STATE ---
    let mut initial_game_state_vec = Vec::new();

    for _i in 0..STATE_SIZE {
        let _game_state = unsafe { wasm_input(0) };
        initial_game_state_vec.push(_game_state);

        zkwasm_rust_sdk::dbg!("game_state: {}\n", _game_state);
    }

    let computed_initial_game_state_hash;

    // check if initial_game_state_vec is all 0
    if initial_game_state_vec != [0; STATE_SIZE] {
        computed_initial_game_state_hash = hash_vec(&initial_game_state_vec);
    } else {
        computed_initial_game_state_hash = [
            16406829232824261652, 11167788843400149284, 2859295262623109964, 11859553537011923029,
        ];
    }

    // let _debug0 = computed_game_state_hash[0];
    // zkwasm_rust_sdk::dbg!("computed_game_state_hash[0]: {}\n", _debug0);
    // let _debug1 = computed_game_state_hash[1];
    // zkwasm_rust_sdk::dbg!("computed_game_state_hash[1]: {}\n", _debug1);
    // let _debug2 = computed_game_state_hash[2];
    // zkwasm_rust_sdk::dbg!("computed_game_state_hash[2]: {}\n", _debug2);
    // let _debug3 = computed_game_state_hash[3];
    // zkwasm_rust_sdk::dbg!("computed_game_state_hash[3]: {}\n", _debug3);

    SpinGame::initialize_game(initial_game_state_vec);

    // specify the private inputs
    let private_inputs_length = unsafe { wasm_input(0) };

    let mut game_inputs = vec![0; private_inputs_length as usize];

    for _i in 0..private_inputs_length {
        let _private_input = unsafe { wasm_input(0) };

        zkwasm_rust_sdk::dbg!("private input: {}\n", _private_input);
        SpinGame::step(_private_input);

        // record to game inputs
        game_inputs[_i as usize] = _private_input;
    }

    let computed_game_input_hash = hash_vec(&game_inputs);

    let computed_meta_transaction_hash = hash_vec(
        &vec![
            game_id,
            computed_initial_game_state_hash[0],
            computed_initial_game_state_hash[1],
            computed_initial_game_state_hash[2],
            computed_initial_game_state_hash[3],
            computed_game_input_hash[0],
            computed_game_input_hash[1],
            computed_game_input_hash[2],
            computed_game_input_hash[3]
        ]
    );

    // let _debug0 = computed_meta_transaction_hash[0];
    // zkwasm_rust_sdk::dbg!("computed_meta_transaction_hash[0]: {}\n", _debug0);
    // let _debug1 = computed_meta_transaction_hash[1];
    // zkwasm_rust_sdk::dbg!("computed_meta_transaction_hash[1]: {}\n", _debug1);
    // let _debug2 = computed_meta_transaction_hash[2];
    // zkwasm_rust_sdk::dbg!("computed_meta_transaction_hash[2]: {}\n", _debug2);
    // let _debug3 = computed_meta_transaction_hash[3];
    // zkwasm_rust_sdk::dbg!("computed_meta_transaction_hash[3]: {}\n", _debug3);

    // Verify the integers are the same as the meta_transaction_hash
    unsafe {
        require(computed_meta_transaction_hash[0] == segment_meta_hash_0);
        require(computed_meta_transaction_hash[1] == segment_meta_hash_1);
        require(computed_meta_transaction_hash[2] == segment_meta_hash_2);
        require(computed_meta_transaction_hash[3] == segment_meta_hash_3);
    }

    // let final_game_state: SpinGameStates = SpinGame::get_game_state();

    // --- GAME transaction data output ---

    // Hash of game state output
    let final_game_state = SpinGame::get_game_state();
    let final_game_state_hash = hash_vec(&final_game_state);

    unsafe {
        wasm_output(final_game_state_hash[0]);
        wasm_output(final_game_state_hash[1]);
        wasm_output(final_game_state_hash[2]);
        wasm_output(final_game_state_hash[3]);
    }

    zkwasm_rust_sdk::dbg!("final_game_state: {:?}\n", final_game_state);

    0
}
