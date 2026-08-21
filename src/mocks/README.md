# Mocks

Realistic mock data used by services when the FastAPI backend isn't available.

Each file exports typed mock arrays and objects that mirror real API responses.
When transitioning to production, these files can be safely deleted — nothing in the components imports from here directly.

All mock data is consumed through the service layer only.
