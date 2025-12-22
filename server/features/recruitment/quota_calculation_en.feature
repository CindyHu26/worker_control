Feature: Recruitment Letter Quota (EN)

  Scenario: Circular Letter - Quota Release Test
    Given There is a recruitment letter "L-001-EN" with quota 3
    And The letter type is "Circular"
    And There are 2 active workers using this letter
    And 1 workers have transferred out
    When Attempt to apply for 1 new worker
    Then System should return "PASS"

  Scenario: One-off Letter - Quota Locked Test
    Given There is a recruitment letter "L-002-EN" with quota 3
    And The letter type is "One-off"
    And There are 2 active workers using this letter
    And 1 workers have transferred out
    When Attempt to apply for 1 new worker
    Then System should return "FAIL"
    And Error message should contain "Used: 3"
