



def verifying_instance_to_commitment(verifying_instance):
    """
    convert verifying_instance[2] abcdefge to geefcdab 
    """
    def reverse_double_hex(hex_str):
        assert len(hex_str) % 2 == 0
        _reversed = ""

        for i in range(0, len(hex_str), 2):
            _reversed = _reversed + hex_str[-i-2] + hex_str[-i-1]
        return _reversed
    x = "0x"
    y = "0x"

    x += reverse_double_hex(verifying_instance[1][2:])
    x += reverse_double_hex(verifying_instance[2][-10:])

    y += reverse_double_hex(verifying_instance[3][2:39] + verifying_instance[2][2:29])

    return x, y

def test():

    SOURCE_X = "0x76139359f8b92705c256a7e90165946f104996cbdf9fe16f0011b54a7e85f12c"
    SOURCE_Y = "0x8b05dc81eb4fd2b6fffc33a319a15c1cefc60379a71b93a9ef9f2dbbb7a8e11b"

    sample_instance = [
    "0x1f2558fa5fb7ac6fa40cff63eb3f3dfeb1009847874389456299d65556054919",
    "0xb511006fe19fdfcb9649106f946501e9a756c20527b9f859931376",
    "0x119a333fcffb6d24feb81dc058b000000000000000002cf1857e4a",
    "0x1be1a8b7bb2d9fefa9931ba77903c6ef1c5ca"
    ]
    x, y = verifying_instance_to_commitment(sample_instance)
    assert x == SOURCE_X
    assert y == SOURCE_Y

test()