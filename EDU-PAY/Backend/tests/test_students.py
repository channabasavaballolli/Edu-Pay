def test_list_students(client, auth_headers):
    resp = client.get("/api/students", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json["data"]
    assert isinstance(data, list)
    assert data[0]["name"] == "Test Student"


def test_create_student(client, auth_headers):
    payload = {
        "name": "Another Student",
        "regno": "REG456",
        "course": "BBA",
        "phone": "8888888888",
        "email": "student2@test.com",
    }
    resp = client.post("/api/students", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json["data"]["name"] == payload["name"]

