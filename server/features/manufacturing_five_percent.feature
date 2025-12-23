Feature: Manufacturing 5% Additional Quota (增額5%機制)

  In order to support the "Manufacturing Domestic 5% Additional Quota" mechanism
  As a Recruitment System
  I need to calculate the allowable quota (C = A - B) based on 3K rates, Extra rates, and average labor count.

  Background:
    Given the following "Manufacturer" industries exist:
      | code | name                 |
      | 10   | Metal Processing     |

  Scenario: Employer with 3K 10% and Extra 20% (Example 1 from Q&A)
    Given an employer "TopMetal" exists with:
      | industry | averageLaborCount |
      | 10       | 100               |
    And "TopMetal" has an active Industry Recognition:
      | tier | allocationRate | extraRate |
      | B    | 0.10           | 0.20      |
    And "TopMetal" has the following existing usage:
      | type     | count |
      | EMPLOYED | 5     |
    When I calculate the 5% Additional Quota for "TopMetal"
    Then the calculation details should be:
      | baseRate | extraRate | fivePercentRate |
      | 0.10     | 0.20      | 0.05            |
    And the formula A should be "(100 * (0.10 + 0.20 + 0.05)) - 5" which equals "30"
    And the formula B should be "(100 * (0.10 + 0.20)) - 5" which equals "25"
    And the authorized 5% quota (C = A - B) should be "5"
    And the total authorized rate (Base + Extra + 5%) is "0.35" which determines "Eligible"

  Scenario: Employer with 3K 10% and No Extra (Example 2 from Q&A)
    Given an employer "SmallMetal" exists with:
      | industry | averageLaborCount |
      | 10       | 100               |
    And "SmallMetal" has an active Industry Recognition:
      | tier | allocationRate | extraRate |
      | B    | 0.10           | 0.00      |
    And "SmallMetal" has the following existing usage:
      | type     | count |
      | EMPLOYED | 1     |
    When I calculate the 5% Additional Quota for "SmallMetal"
    Then the calculation details should be:
      | baseRate | extraRate | fivePercentRate |
      | 0.10     | 0.00      | 0.05            |
    And the formula A should be "(100 * (0.10 + 0.05)) - 1" which equals "14"
    And the formula B should be "(100 * 0.10) - 1" which equals "9"
    And the authorized 5% quota (C = A - B) should be "5"

  Scenario: Employer Exceeds 40% Cap (Example 3 from Q&A)
    Given an employer "GreedyMetal" exists with:
      | industry | averageLaborCount |
      | 10       | 100               |
    And "GreedyMetal" has an active Industry Recognition:
      | tier | allocationRate | extraRate |
      | A+   | 0.20           | 0.20      |
    When I calculate the 5% Additional Quota for "GreedyMetal"
    Then the total authorized rate (Base + Extra + 5%) is "0.45" which determines "Not Eligible"
    And the authorized 5% quota should be "0"

  Scenario: Handling Missing Workers (Runaway) (Example 11 from Q&A)
    Given an employer "RunawayCo" exists with:
      | industry | averageLaborCount |
      | 10       | 100               |
    And "RunawayCo" has an active Industry Recognition:
      | tier | allocationRate | extraRate |
      | B    | 0.10           | 0.20      |
    And "RunawayCo" has the following existing usage:
      | type    | count |
      | RUNAWAY | 4     |
    # Note: Runaway counts as used quota if not given up.
    # If employer "asserts to give up" the spot (via not filling it?), the math is same as 'used'.
    # Wait, the Q&A says "If employer asserts to give up runaway quota... Upper limit is 5".
    # This implies the formula subtracts valid permits. Given up runaway = subtracted.
    # Actually, the formula subtracts (Employed + Permitted + Re-hirable/Fillable).
    # Runaway is 'Re-hirable' until given up. If given up, it's removed from 'Re-hirable'.
    # But C = A - B.
    # A = Total(35%) - Existing. B = Total(30%) - Existing.
    # If I give up 1 runaway spot: Existing decreases by 1.
    # A becomes (35 - (OldUsage - 1)) = (35 - OldUsage) + 1
    # B becomes (30 - (OldUsage - 1)) = (30 - OldUsage) + 1
    # C = A - B = ((35 - Old) + 1) - ((30 - Old) + 1) = 5.
    # So 'Existing Usage' cancels out in the C = A - B formula, unless it hits a cap (negative numbers).
    # The authorized 5% quota C is effectively "AverageLabor * 0.05", provided (Base+Extra+5%) <= 40% and A >= 0.
    
    When I calculate the 5% Additional Quota for "RunawayCo"
    Then the authorized 5% quota (C = A - B) should be "5"
