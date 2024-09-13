use sha2::{ Sha256, Digest };

pub fn to_big_endian_padded(value: &u64) -> Vec<u8> {
    let mut buffer = vec![0u8; 32]; // 256 bits, equivalent to uint256
    buffer[24..32].copy_from_slice(&value.to_be_bytes()); // Place the u64 value in the last 8 bytes
    buffer
}

fn abi_encode(input: &Vec<u64>) -> Vec<u8> {
    let mut data = Vec::new();
    for value in input {
        data.extend_from_slice(&to_big_endian_padded(value));
    }
    data
}

pub fn hash_vec(input: &Vec<u64>) -> [u64; 4] {
    let mut hasher = Sha256::new();
    let data = abi_encode(&input);
    hasher.update(&data);
    let hash_result = hasher.finalize();
    let mut integers = [0u64; 4]; // To store the four u64 integers

    // Convert each 8-byte slice of the hash result into a u64 using native endianess
    for i in 0..4 {
        integers[i] = u64::from_be_bytes(
            hash_result[i * 8..(i + 1) * 8].try_into().expect("slice with incorrect length")
        );
    }
    integers
}
