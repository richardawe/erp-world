-- Add initial sources
INSERT INTO sources (url, vendor, type, active) VALUES
  ('https://news.sap.com/feed/', 'SAP', 'rss', true),
  ('https://blogs.oracle.com/feed', 'Oracle', 'rss', true),
  ('https://cloudblogs.microsoft.com/dynamics365/feed/', 'Microsoft', 'rss', true),
  ('https://www.workday.com/en-us/company/newsroom/press-releases.html', 'Workday', 'html', true),
  ('https://www.unit4.com/news', 'Unit4', 'html', true),
  ('https://www.infor.com/news', 'Infor', 'html', true),
  ('https://www.sage.com/en-gb/news/press-releases/', 'Sage', 'html', true),
  ('https://www.netsuite.com/portal/company/pressreleases.shtml', 'NetSuite', 'html', true),
  ('https://www.epicor.com/en-us/newsroom/', 'Epicor', 'html', true),
  ('https://www.ifs.com/news', 'IFS', 'html', true),
  ('https://www.odoo.com/blog/odoo-news-5/feed', 'Odoo', 'rss', true),
  ('https://www.acumatica.com/news/', 'Acumatica', 'html', true),
  ('https://www.syspro.com/blog/feed/', 'SYSPRO', 'rss', true),
  ('https://www.deltek.com/en/about/media-center', 'Deltek', 'html', true),
  ('https://www.qad.com/about/news', 'QAD', 'html', true);

-- Add tech news sources
INSERT INTO sources (url, vendor, type, active) VALUES
  ('https://venturebeat.com/category/ai/feed/', 'VentureBeat', 'rss', true),
  ('https://techcrunch.com/tag/artificial-intelligence/feed/', 'TechCrunch', 'rss', true),
  ('https://www.zdnet.com/topic/artificial-intelligence/rss.xml', 'ZDNet', 'rss', true),
  ('https://www.computerweekly.com/rss/Enterprise-software.xml', 'ComputerWeekly', 'rss', true),
  ('https://www.informationweek.com/rss_simple.asp', 'InformationWeek', 'rss', true); 