//const apparments_service = require('./../apparments_service');
const mapper = require('../mapper')
const {parseKeys, parseTime, getDateFromLocaleString } = require('../utils/utils')

test('test mapper', () => {

  expect(parseKeys("7key")).toBe(7)
  expect(parseKeys("7  key")).toBe(7)
  expect(parseKeys("7:00 key")).toBe(null)
  expect(parseKeys(" 8 key")).toBe(8)
  expect(parseKeys(" 8 keydfas")).toBe(null)
  expect(parseKeys(" 8 keys")).toBe(8)
  expect(parseKeys(" 8 keys dfasdf")).toBe(8)
  expect(parseKeys("sdafsdfa 8 keys dfasdf")).toBe(8)
});

test('test mapper', () => {

    expect(parseTime("6:00")).toBe("6:00")
    expect(parseTime("06:00")).toBe("06:00")
    expect(parseTime("7:00 key")).toBe("7:00")
    expect(parseTime(" 8 key")).toBe(null)
    expect(parseTime(" 8 12:00 keydfas")).toBe("12:00")
    expect(parseTime("  12:00 8 keys")).toBe("12:00")
    expect(parseTime(" 8 keys 12:00")).toBe("12:00")
    expect(parseTime(" 8 keys 12:00  ")).toBe("12:00")
    expect(parseTime(" 8 keys 12:00sdfa  ")).toBe(null)
    expect(parseTime(" 8 keys afsd12:00  ")).toBe(null)
  });


  // test('test mapper', () => {

  //   expect(getDateFromLocaleString("Wed 27 Oct 2021", "Europe/Madrid")).toBe("6:00")
    
  // });