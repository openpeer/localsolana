/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/local_solana_migrate.json`.
 */
export type LocalSolanaMigrate = {
  "address": "CCuEMUp5dNWkfCwLX6zFr96n2hKs9DbmZ9yxjA1pbjyt",
  "metadata": {
    "name": "localSolanaMigrate",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Program for Local Solana Gasless Solana"
  },
  "instructions": [
    {
      "name": "buyerCancel",
      "discriminator": [
        110,
        82,
        216,
        227,
        40,
        38,
        49,
        69
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "orderId"
              }
            ]
          }
        },
        {
          "name": "seller",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "string"
        }
      ]
    },
    {
      "name": "createEscrowSol",
      "discriminator": [
        92,
        113,
        86,
        137,
        12,
        174,
        217,
        134
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "orderId"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "buyer"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "partner"
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "string"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "sellerWaitingTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "createEscrowToken",
      "discriminator": [
        171,
        87,
        51,
        131,
        93,
        129,
        118,
        95
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "orderId"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "buyer"
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "sellerTokenAccount",
          "writable": true,
          "optional": true
        },
        {
          "name": "partner"
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "string"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "sellerWaitingTime",
          "type": "i64"
        },
        {
          "name": "automaticEscrow",
          "type": "bool"
        },
        {
          "name": "token",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "deposit",
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "token",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "arbitrator"
        },
        {
          "name": "feeRecipient"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "feeBps",
          "type": "u64"
        },
        {
          "name": "disputeFee",
          "type": "u64"
        },
        {
          "name": "feeDiscountNft",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "markAsPaid",
      "discriminator": [
        80,
        186,
        247,
        245,
        194,
        52,
        252,
        248
      ],
      "accounts": [
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "orderId"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "seller"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "string"
        }
      ]
    },
    {
      "name": "openDispute",
      "discriminator": [
        137,
        25,
        99,
        119,
        23,
        223,
        161,
        42
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "orderId"
              }
            ]
          }
        },
        {
          "name": "payer",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "string"
        }
      ]
    },
    {
      "name": "releaseFunds",
      "discriminator": [
        225,
        88,
        91,
        108,
        126,
        52,
        2,
        26
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "orderId"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "buyer",
          "writable": true
        },
        {
          "name": "feeRecipient",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "string"
        }
      ]
    },
    {
      "name": "resolveDispute",
      "discriminator": [
        231,
        6,
        202,
        6,
        96,
        103,
        12,
        230
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "orderId"
              }
            ]
          }
        },
        {
          "name": "arbitrator",
          "signer": true
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "string"
        },
        {
          "name": "winner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "sellerCancel",
      "discriminator": [
        32,
        135,
        125,
        225,
        9,
        49,
        24,
        176
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "orderId"
              }
            ]
          }
        },
        {
          "name": "seller",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "orderId",
          "type": "string"
        }
      ]
    },
    {
      "name": "withdrawBalance",
      "discriminator": [
        140,
        79,
        65,
        53,
        68,
        73,
        241,
        211
      ],
      "accounts": [
        {
          "name": "escrowState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "token",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    },
    {
      "name": "escrowState",
      "discriminator": [
        19,
        90,
        148,
        111,
        55,
        130,
        229,
        108
      ]
    }
  ],
  "events": [
    {
      "name": "cancelledByBuyer",
      "discriminator": [
        152,
        170,
        30,
        135,
        177,
        216,
        222,
        73
      ]
    },
    {
      "name": "cancelledBySeller",
      "discriminator": [
        69,
        130,
        185,
        167,
        253,
        242,
        81,
        47
      ]
    },
    {
      "name": "disputeOpened",
      "discriminator": [
        239,
        222,
        102,
        235,
        193,
        85,
        1,
        214
      ]
    },
    {
      "name": "disputeResolved",
      "discriminator": [
        121,
        64,
        249,
        153,
        139,
        128,
        236,
        187
      ]
    },
    {
      "name": "escrowCreated",
      "discriminator": [
        70,
        127,
        105,
        102,
        92,
        97,
        7,
        173
      ]
    },
    {
      "name": "released",
      "discriminator": [
        232,
        229,
        255,
        136,
        101,
        189,
        15,
        220
      ]
    },
    {
      "name": "sellerCancelDisabled",
      "discriminator": [
        95,
        10,
        82,
        215,
        181,
        251,
        220,
        183
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6001,
      "name": "invalidSellerWaitingTime",
      "msg": "Invalid seller waiting time"
    },
    {
      "code": 6002,
      "name": "escrowNotFound",
      "msg": "Escrow not found"
    },
    {
      "code": 6003,
      "name": "cannotOpenDisputeYet",
      "msg": "Cannot open dispute yet"
    },
    {
      "code": 6004,
      "name": "insufficientFundsForDispute",
      "msg": "Insufficient funds for dispute"
    },
    {
      "code": 6005,
      "name": "disputeNotOpen",
      "msg": "Dispute not open"
    },
    {
      "code": 6006,
      "name": "invalidWinner",
      "msg": "Invalid winner"
    },
    {
      "code": 6007,
      "name": "orderAlreadyExists",
      "msg": "Order already exists"
    },
    {
      "code": 6008,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6009,
      "name": "invalidBuyer",
      "msg": "Invalid buyer"
    },
    {
      "code": 6010,
      "name": "cannotCancelYet",
      "msg": "Cannot cancel yet"
    },
    {
      "code": 6011,
      "name": "serializationError",
      "msg": "Serialization error"
    },
    {
      "code": 6012,
      "name": "alreadyInitialized",
      "msg": "Already initialized"
    },
    {
      "code": 6013,
      "name": "cannotReleaseFundsYet",
      "msg": "Cannot release funds as order is not marked as paid"
    },
    {
      "code": 6014,
      "name": "invalidFeeRecepient",
      "msg": "Invalid Fee Recepient"
    },
    {
      "code": 6015,
      "name": "invalidDisputeInitiator",
      "msg": "Invalid Dispute Initiator"
    }
  ],
  "types": [
    {
      "name": "cancelledByBuyer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "cancelledBySeller",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "disputeOpened",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "string"
          },
          {
            "name": "sender",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "disputeResolved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "string"
          },
          {
            "name": "winner",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "exists",
            "type": "bool"
          },
          {
            "name": "sellerCanCancelAfter",
            "type": "i64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "dispute",
            "type": "bool"
          },
          {
            "name": "partner",
            "type": "pubkey"
          },
          {
            "name": "openPeerFee",
            "type": "u64"
          },
          {
            "name": "automaticEscrow",
            "type": "bool"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "token",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "sellerPaidDispute",
            "type": "bool"
          },
          {
            "name": "buyerPaidDispute",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "escrowCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "escrowState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u64"
          },
          {
            "name": "arbitrator",
            "type": "pubkey"
          },
          {
            "name": "feeRecipient",
            "type": "pubkey"
          },
          {
            "name": "feeDiscountNft",
            "type": "pubkey"
          },
          {
            "name": "disputeFee",
            "type": "u64"
          },
          {
            "name": "deployer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "released",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "sellerCancelDisabled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "orderId",
            "type": "string"
          }
        ]
      }
    }
  ]
};
