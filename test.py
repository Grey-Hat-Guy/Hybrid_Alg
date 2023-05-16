#!/usr/bin/python3

import rsa
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from secrets import token_bytes
import os


def camellia_encrypt_file(key, input_file):
    """
    Encrypts the contents of an input file using Camellia and saves the encrypted data to an output file.
    """
    iv = token_bytes(16)  # Generate a random 16-byte IV
    cipher = Cipher(algorithms.Camellia(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    padder = padding.PKCS7(128).padder()
    x = input_file.split(".")
    output_file = x[0] + "_cam" + ".egnc"
    with open(input_file, "rb") as file:
        plaintext = file.read()
        ciphertext = encryptor.update(padder.update(plaintext) + padder.finalize()) + encryptor.finalize()
        with open(output_file, "wb") as enc_file:
            enc_file.write(iv + ciphertext)
    print(f"\nCamellia Encryption 100%.")
    return output_file


def rsa_encrypt_file(key, input_file):
    """
    Encrypts the contents of an input file using RSA and saves the encrypted data to an output file.
    """
    x = input_file.split("_")
    output_filename = x[0] + ".enc"
    end_file = open(output_filename, "wb")
    start_file = open(input_file, "rb")

    while True:
        # Read the input file data
        chunk = start_file.read(128)
        # Break the loop if no data is left
        if not chunk:
            break
        else:
            ciphertext = rsa.encrypt(chunk, key)
            end_file.write(ciphertext)
            ciphertext = ""

    end_file.close()
    start_file.close()
    print(f"\nRSA Re-encryption 100%.")
    return output_filename


def camellia_decrypt_file(key, input_file):
    """
    Decrypts the contents of an input file that was encrypted using Camellia, and saves the decrypted data to an output file.
    """
    x = input_file.split("_")
    print(x)
    output_file = x[0] + "_decrypted" + ".txt"
    with open(input_file, "rb") as file:
        iv = file.read(16)
        cipher = Cipher(algorithms.Camellia(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        unpadder = padding.PKCS7(128).unpadder()
        ciphertext = file.read()
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        plaintext = unpadder.update(plaintext) + unpadder.finalize()
        with open(output_file, "wb") as dec_file:
            dec_file.write(plaintext)
    print(f"\nCamellia Decryption 100%.")
    return output_file

def rsa_decrypt_file(key, input_file):
    """
    Decrypts the contents of an input file that has been encrypted using RSA and returns the decrypted data.
    """
    x = input_file.split('.')
    print(x)
    output_filename = x[0] + '_decrypted.' + x[1]
    end_file = open(output_filename, 'wb')
    start_file = open(input_file, 'rb')

    while True:
        # Read the input file data
        chunk = start_file.read(256)
        # Break the loop if no data is left
        if not chunk:
            break
        else:
            plaintext = rsa.decrypt(chunk, key)
            end_file.write(plaintext)

    end_file.close()
    start_file.close()
    # print(f"File '{input_file}' decrypted using RSA, and saved as '{output_file}'.")
    print(f"\nRSA Decryption 100%.")

    return output_filename


def main(input_file):
    
    (pub_key, pri_key) = rsa.newkeys(2048)

    # Encrypt a file using Camellia and then RSA
    # input_file = "sample.txt"
    cam_key = os.urandom(32)
    cam_encrypted_file = camellia_encrypt_file(cam_key, input_file)
    encrypted_filename = rsa_encrypt_file(pub_key, cam_encrypted_file)

    print("\nEncryption done 100% file name --------> {} ".format(encrypted_filename))

    #decrypted_file = decrypt_camellia_rsa(cam_key, pri_key, encrypted_filename)
    de_cam = rsa_decrypt_file(pri_key, encrypted_filename)
    decrypted_file = camellia_decrypt_file(cam_key, de_cam)
    
    print("\nThe Decryption is done Decrypted filename ----> {}".format(decrypted_file))
    #Removing unwanted an temp files
    os.remove(cam_encrypted_file)
    os.remove(de_cam)
    return encrypted_filename

# if __name__ == '__main__':
#     main()
