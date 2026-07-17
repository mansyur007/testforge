Feature: BDD Login Feature

  Background:
    Given the app is running

  @smoke @auth
  Scenario: Valid credentials log the user in
    Given the user is on the login page
    When they submit a valid email and password
    Then they land on the dashboard

  @auth
  Scenario: Invalid password is rejected
    Given the user is on the login page
    When they submit an invalid password
    Then an error message is shown
