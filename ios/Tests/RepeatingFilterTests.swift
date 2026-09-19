import XCTest
@testable import NitroSpeechLogic

final class RepeatingFilterTests: XCTestCase {
    func testPassesThroughUniqueWords() {
        XCTAssertEqual(RepeatingFilter.apply("hello world"), "hello world")
    }

    func testDropsConsecutiveDuplicates() {
        XCTAssertEqual(RepeatingFilter.apply("and and then then then go"), "and then go")
    }

    func testKeepsNonConsecutiveRepeats() {
        XCTAssertEqual(RepeatingFilter.apply("go and go"), "go and go")
    }

    func testKeepsNumberTokensEvenWhenRepeated() {
        XCTAssertEqual(RepeatingFilter.apply("room 12 12 please"), "room 12 12 please")
    }

    func testEmptyString() {
        XCTAssertEqual(RepeatingFilter.apply(""), "")
    }

    func testSingleWord() {
        XCTAssertEqual(RepeatingFilter.apply("hello"), "hello")
    }

    func testCollapsesLongUnstableTailWithoutLosingPrefix() {
        let input = "one two three four five six seven eight nine ten ten ten"
        let output = RepeatingFilter.apply(input)
        XCTAssertTrue(output.hasPrefix("one two"))
        XCTAssertFalse(output.contains("ten ten"))
        XCTAssertTrue(output.hasSuffix("ten"))
    }

    func testWhitespaceSplit() {
        XCTAssertEqual(RepeatingFilter.apply("  hello   hello  world "), "hello world")
    }
}
