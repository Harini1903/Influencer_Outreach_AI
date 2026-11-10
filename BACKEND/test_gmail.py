from app.services.gmail_service import get_gmail_service


def main():
    print("Testing Gmail authentication...")

    service = get_gmail_service()

    print("Gmail service created successfully.")
    print("Gmail authentication is ready for sending emails.")


if __name__ == "__main__":
    main()