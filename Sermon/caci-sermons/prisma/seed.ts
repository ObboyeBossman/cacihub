import { db } from "../src/lib/db"

async function main() {
  // Clean up
  await db.sermon.deleteMany()
  await db.sermonSeries.deleteMany()
  await db.ministry.deleteMany()

  // ────────────────────────────────────────────────────────────
  // Series 1 — Foundations of Faith (2023, completed)
  // ────────────────────────────────────────────────────────────
  const foundations = await db.sermonSeries.create({
    data: {
      title: "Foundations of Faith",
      description:
        "A foundational series establishing the core pillars of the Christian walk — from salvation to spiritual discipline. Every believer needs a firm foundation to weather the storms of life.",
      theme: "Building on the Rock",
      anchorText: "Matthew 7:24",
      coverImage: "/covers/foundations.jpg",
      year: 2023,
      status: "completed",
      startDate: new Date("2023-01-08"),
      endDate: new Date("2023-02-12"),
      sermons: {
        create: [
          {
            title: "The New Birth",
            description:
              "What does it truly mean to be born again? This sermon explores the miracle of salvation and the transformation that takes place when Christ enters the heart.",
            theme: "Salvation & Regeneration",
            scripture: "John 3:1-8",
            quotations: JSON.stringify([
              {
                reference: "John 3:3",
                text: "Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.",
              },
              {
                reference: "2 Corinthians 5:17",
                text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.",
              },
              {
                reference: "Ephesians 2:8-9",
                text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
              },
            ]),
            sequence: 1,
            datePreached: new Date("2023-01-08"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2880,
          },
          {
            title: "Repentance: Turning Back to God",
            description:
              "Repentance is more than sorrow — it is a decisive turn. We examine true godly sorrow that leads to life and lasting change.",
            theme: "Repentance",
            scripture: "Acts 3:19",
            quotations: JSON.stringify([
              {
                reference: "Acts 3:19",
                text: "Repent ye therefore, and be converted, that your sins may be blotted out, when the times of refreshing shall come from the presence of the Lord.",
              },
              {
                reference: "2 Corinthians 7:10",
                text: "For godly sorrow worketh repentance to salvation not to be repented of: but the sorrow of the world worketh death.",
              },
              {
                reference: "1 John 1:9",
                text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
              },
            ]),
            sequence: 2,
            datePreached: new Date("2023-01-15"),
            preacher: "Elder Daniel Mensah",
            duration: 2640,
          },
          {
            title: "Baptism in Water",
            description:
              "Water baptism is an outward sign of an inward reality. This message unpacks the meaning, mode, and significance of baptism.",
            theme: "Water Baptism",
            scripture: "Romans 6:3-4",
            quotations: JSON.stringify([
              {
                reference: "Romans 6:3-4",
                text: "Know ye not, that so many of us as were baptized into Jesus Christ were baptized into his death? Therefore we are buried with him by baptism into death.",
              },
              {
                reference: "Acts 2:38",
                text: "Then Peter said unto them, Repent, and be baptized every one of you in the name of Jesus Christ for the remission of sins.",
              },
              {
                reference: "Matthew 28:19",
                text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.",
              },
            ]),
            sequence: 3,
            datePreached: new Date("2023-01-22"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2700,
          },
          {
            title: "The Filling of the Holy Spirit",
            description:
              "God's plan is for every believer to be filled with the Spirit. We discover what that means and how to receive this empowering.",
            theme: "Holy Spirit Baptism",
            scripture: "Acts 1:8",
            quotations: JSON.stringify([
              {
                reference: "Acts 1:8",
                text: "But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me.",
              },
              {
                reference: "Ephesians 5:18",
                text: "And be not drunk with wine, wherein is excess; but be filled with the Spirit.",
              },
              {
                reference: "Acts 2:4",
                text: "And they were all filled with the Holy Ghost, and began to speak with other tongues, as the Spirit gave them utterance.",
              },
            ]),
            sequence: 4,
            datePreached: new Date("2023-01-29"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 3000,
          },
          {
            title: "Prayer: The Believer's Breath",
            description:
              "Prayer is not a ritual but a relationship. Learn how to cultivate a vibrant prayer life that moves heaven and earth.",
            theme: "Prayer & Communion",
            scripture: "Luke 18:1",
            quotations: JSON.stringify([
              {
                reference: "Luke 18:1",
                text: "And he spake a parable unto them to this end, that men ought always to pray, and not to faint.",
              },
              {
                reference: "Philippians 4:6-7",
                text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
              },
              {
                reference: "James 5:16",
                text: "The effectual fervent prayer of a righteous man availeth much.",
              },
            ]),
            sequence: 5,
            datePreached: new Date("2023-02-05"),
            preacher: "Elder Daniel Mensah",
            duration: 2520,
          },
          {
            title: "The Word: Our Daily Bread",
            description:
              "A life built on God's Word stands firm. We conclude the foundations series with a call to immerse ourselves in Scripture.",
            theme: "Bible Study & Meditation",
            scripture: "Matthew 4:4",
            quotations: JSON.stringify([
              {
                reference: "Matthew 4:4",
                text: "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.",
              },
              {
                reference: "Joshua 1:8",
                text: "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night.",
              },
              {
                reference: "Psalm 119:105",
                text: "Thy word is a lamp unto my feet, and a light unto my path.",
              },
            ]),
            sequence: 6,
            datePreached: new Date("2023-02-12"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2760,
          },
        ],
      },
    },
  })

  // ────────────────────────────────────────────────────────────
  // Series 2 — Walking in the Spirit (2024, completed)
  // ────────────────────────────────────────────────────────────
  const walking = await db.sermonSeries.create({
    data: {
      title: "Walking in the Spirit",
      description:
        "A journey through what it means to live a Spirit-led life. From the fruit of the Spirit to spiritual gifts, this series equips believers to walk in step with the Holy Spirit every day.",
      theme: "Life in the Spirit",
      anchorText: "Galatians 5:25",
      coverImage: "/covers/walking.jpg",
      year: 2024,
      status: "completed",
      startDate: new Date("2024-05-05"),
      endDate: new Date("2024-06-09"),
      sermons: {
        create: [
          {
            title: "The Person of the Holy Spirit",
            description:
              "Who is the Holy Spirit? He is not a force or a feeling — He is the third Person of the Godhead, our Comforter and Guide.",
            theme: "Knowing the Spirit",
            scripture: "John 14:16-17",
            quotations: JSON.stringify([
              {
                reference: "John 14:16-17",
                text: "And I will pray the Father, and he shall give you another Comforter, that he may abide with you for ever; Even the Spirit of truth.",
              },
              {
                reference: "John 16:13",
                text: "Howbeit when he, the Spirit of truth, is come, he will guide you into all truth.",
              },
              {
                reference: "Acts 5:3-4",
                text: "Ananias, why hath Satan filled thine heart to lie to the Holy Ghost? thou hast not lied unto men, but unto God.",
              },
            ]),
            sequence: 1,
            datePreached: new Date("2024-05-05"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 3060,
          },
          {
            title: "Led by the Spirit",
            description:
              "Sons of God are led by the Spirit. How do we recognize His leading and distinguish it from our own desires?",
            theme: "Divine Guidance",
            scripture: "Romans 8:14",
            quotations: JSON.stringify([
              {
                reference: "Romans 8:14",
                text: "For as many as are led by the Spirit of God, they are the sons of God.",
              },
              {
                reference: "Proverbs 3:5-6",
                text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him.",
              },
              {
                reference: "Isaiah 30:21",
                text: "And thine ears shall hear a word behind thee, saying, This is the way, walk ye in it.",
              },
            ]),
            sequence: 2,
            datePreached: new Date("2024-05-12"),
            preacher: "Elder Daniel Mensah",
            duration: 2820,
          },
          {
            title: "The Fruit of the Spirit",
            description:
              "When the Spirit fills a life, fruit follows. We explore love, joy, peace, and the full harvest of a Spirit-led character.",
            theme: "Christlike Character",
            scripture: "Galatians 5:22-23",
            quotations: JSON.stringify([
              {
                reference: "Galatians 5:22-23",
                text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance.",
              },
              {
                reference: "John 15:5",
                text: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit.",
              },
              {
                reference: "Ephesians 5:9",
                text: "For the fruit of the Spirit is in all goodness and righteousness and truth.",
              },
            ]),
            sequence: 3,
            datePreached: new Date("2024-05-19"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2940,
          },
          {
            title: "Gifts of the Spirit",
            description:
              "The Spirit distributes gifts to every believer for the common good. Discover your gift and how to steward it.",
            theme: "Spiritual Empowerment",
            scripture: "1 Corinthians 12:7",
            quotations: JSON.stringify([
              {
                reference: "1 Corinthians 12:7",
                text: "But the manifestation of the Spirit is given to every man to profit withal.",
              },
              {
                reference: "1 Peter 4:10",
                text: "As every man hath received the gift, even so minister the same one to another, as good stewards of the manifold grace of God.",
              },
              {
                reference: "Romans 12:6",
                text: "Having then gifts differing according to the grace that is given to us, whether prophecy, let us prophesy according to the proportion of faith.",
              },
            ]),
            sequence: 4,
            datePreached: new Date("2024-05-26"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 3180,
          },
          {
            title: "Praying in the Spirit",
            description:
              "Spirit-led prayer builds up the believer. We examine praying with the spirit, intercession, and spiritual warfare.",
            theme: "Spiritual Prayer",
            scripture: "Jude 1:20",
            quotations: JSON.stringify([
              {
                reference: "Jude 1:20",
                text: "But ye, beloved, building up yourselves on your most holy faith, praying in the Holy Ghost.",
              },
              {
                reference: "Romans 8:26",
                text: "Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought.",
              },
              {
                reference: "Ephesians 6:18",
                text: "Praying always with all prayer and supplication in the Spirit, and watching thereunto with all perseverance.",
              },
            ]),
            sequence: 5,
            datePreached: new Date("2024-06-09"),
            preacher: "Elder Daniel Mensah",
            duration: 2700,
          },
        ],
      },
    },
  })

  // ────────────────────────────────────────────────────────────
  // Series 3 — Kingdom Principles (2024, completed)
  // ────────────────────────────────────────────────────────────
  const kingdom = await db.sermonSeries.create({
    data: {
      title: "Kingdom Principles",
      description:
        "The Kingdom of God operates by principles that differ from the world. This series unveils the upside-down wisdom of God's Kingdom — where the greatest serves, the least is blessed, and giving leads to receiving.",
      theme: "Living as Kingdom Citizens",
      anchorText: "Matthew 6:33",
      coverImage: "/covers/kingdom.jpg",
      year: 2024,
      status: "completed",
      startDate: new Date("2024-09-08"),
      endDate: new Date("2024-09-29"),
      sermons: {
        create: [
          {
            title: "Seek First the Kingdom",
            description:
              "When God's Kingdom becomes our priority, everything else falls into place. The principle of first things first.",
            theme: "Priority & Devotion",
            scripture: "Matthew 6:33",
            quotations: JSON.stringify([
              {
                reference: "Matthew 6:33",
                text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
              },
              {
                reference: "Haggai 1:7-8",
                text: "Thus saith the Lord of hosts; Consider your ways. Go up to the mountain, and bring wood, and build the house.",
              },
              {
                reference: "Proverbs 3:9",
                text: "Honour the Lord with thy substance, and with the firstfruits of all thine increase.",
              },
            ]),
            sequence: 1,
            datePreached: new Date("2024-09-08"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2880,
          },
          {
            title: "The Principle of Sowing and Reaping",
            description:
              "Every life is a field. What we sow, we reap — in our words, our giving, our actions. This is an unchanging Kingdom law.",
            theme: "Stewardship & Generosity",
            scripture: "Galatians 6:7",
            quotations: JSON.stringify([
              {
                reference: "Galatians 6:7",
                text: "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.",
              },
              {
                reference: "2 Corinthians 9:6",
                text: "But this I say, He which soweth sparingly shall reap also sparingly; and he which soweth bountifully shall reap also bountifully.",
              },
              {
                reference: "Luke 6:38",
                text: "Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over.",
              },
            ]),
            sequence: 2,
            datePreached: new Date("2024-09-15"),
            preacher: "Elder Daniel Mensah",
            duration: 2640,
          },
          {
            title: "The Principle of Servant Leadership",
            description:
              "In God's Kingdom, to lead is to serve. The greatest among you shall be the servant of all.",
            theme: "Humility & Service",
            scripture: "Mark 10:43-44",
            quotations: JSON.stringify([
              {
                reference: "Mark 10:43-44",
                text: "But so shall it not be among you: but whosoever will be great among you, shall be your minister: And whosoever of you will be the chiefest, shall be servant of all.",
              },
              {
                reference: "John 13:14-15",
                text: "If I then, your Lord and Master, have washed your feet; ye also ought to wash one another's feet.",
              },
              {
                reference: "Philippians 2:5-7",
                text: "Let this mind be in you, which was also in Christ Jesus: who made himself of no reputation, and took upon him the form of a servant.",
              },
            ]),
            sequence: 3,
            datePreached: new Date("2024-09-22"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2760,
          },
          {
            title: "The Principle of Forgiveness",
            description:
              "A Kingdom citizen forgives because they have been forgiven. Unforgiveness blocks the flow of God's blessing.",
            theme: "Grace & Mercy",
            scripture: "Matthew 6:14-15",
            quotations: JSON.stringify([
              {
                reference: "Matthew 6:14-15",
                text: "For if ye forgive men their trespasses, your heavenly Father will also forgive you: But if ye forgive not men their trespasses, neither will your Father forgive yours.",
              },
              {
                reference: "Colossians 3:13",
                text: "Forbearing one another, and forgiving one another, even as Christ forgave you, so also do ye.",
              },
              {
                reference: "Ephesians 4:32",
                text: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
              },
            ]),
            sequence: 4,
            datePreached: new Date("2024-09-29"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2700,
          },
        ],
      },
    },
  })

  // ────────────────────────────────────────────────────────────
  // Series 4 — The Sermon on the Mount (2025, ongoing)
  // ────────────────────────────────────────────────────────────
  const mount = await db.sermonSeries.create({
    data: {
      title: "The Sermon on the Mount",
      description:
        "The greatest sermon ever preached. Jesus' blueprint for Kingdom living from Matthew 5-7 — the Beatitudes, the Lord's Prayer, the narrow gate, and what it truly means to be His disciple. This is our current ongoing series.",
      theme: "Jesus' Blueprint for Life",
      anchorText: "Matthew 5:1-2",
      coverImage: "/covers/mount.jpg",
      year: 2025,
      status: "ongoing",
      startDate: new Date("2025-01-12"),
      sermons: {
        create: [
          {
            title: "Blessed Are the Poor in Spirit",
            description:
              "The Kingdom begins with emptiness. Only those who recognize their spiritual poverty can receive the riches of God's Kingdom.",
            theme: "Spiritual Brokenness",
            scripture: "Matthew 5:3",
            quotations: JSON.stringify([
              {
                reference: "Matthew 5:3",
                text: "Blessed are the poor in spirit: for theirs is the kingdom of heaven.",
              },
              {
                reference: "Isaiah 66:2",
                text: "To this man will I look, even to him that is poor and of a contrite spirit, and trembleth at my word.",
              },
              {
                reference: "Psalm 51:17",
                text: "The sacrifices of God are a broken spirit: a broken and a contrite heart, O God, thou wilt not despise.",
              },
            ]),
            sequence: 1,
            datePreached: new Date("2025-01-12"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2940,
          },
          {
            title: "Blessed Are They That Mourn",
            description:
              "There is a mourning that leads to comfort — a holy sorrow for sin and a heart that grieves what grieves God.",
            theme: "Godly Sorrow",
            scripture: "Matthew 5:4",
            quotations: JSON.stringify([
              {
                reference: "Matthew 5:4",
                text: "Blessed are they that mourn: for they shall be comforted.",
              },
              {
                reference: "Psalm 30:5",
                text: "Weeping may endure for a night, but joy cometh in the morning.",
              },
              {
                reference: "Isaiah 61:2-3",
                text: "To comfort all that mourn; To appoint unto them that mourn in Zion, to give unto them beauty for ashes.",
              },
            ]),
            sequence: 2,
            datePreached: new Date("2025-01-19"),
            preacher: "Elder Daniel Mensah",
            duration: 2700,
          },
          {
            title: "Blessed Are the Meek",
            description:
              "Meekness is not weakness — it is power under control. The meek inherit the earth because they trust the Judge of all.",
            theme: "Gentleness & Trust",
            scripture: "Matthew 5:5",
            quotations: JSON.stringify([
              {
                reference: "Matthew 5:5",
                text: "Blessed are the meek: for they shall inherit the earth.",
              },
              {
                reference: "Psalm 37:11",
                text: "But the meek shall inherit the earth; and shall delight themselves in the abundance of peace.",
              },
              {
                reference: "Numbers 12:3",
                text: "Now the man Moses was very meek, above all the men which were upon the face of the earth.",
              },
            ]),
            sequence: 3,
            datePreached: new Date("2025-01-26"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2820,
          },
          {
            title: "Blessed Are They Which Hunger and Thirst",
            description:
              "A holy appetite for righteousness. When we crave God's righteousness as desperately as food and drink, we shall be filled.",
            theme: "Righteous Appetite",
            scripture: "Matthew 5:6",
            quotations: JSON.stringify([
              {
                reference: "Matthew 5:6",
                text: "Blessed are they which do hunger and thirst after righteousness: for they shall be filled.",
              },
              {
                reference: "Psalm 42:1-2",
                text: "As the hart panteth after the water brooks, so panteth my soul after thee, O God. My soul thirsteth for God.",
              },
              {
                reference: "Isaiah 55:1-2",
                text: "Ho, every one that thirsteth, come ye to the waters. Wherefore do ye spend money for that which is not bread?",
              },
            ]),
            sequence: 4,
            datePreached: new Date("2025-02-02"),
            preacher: "Pastor Emmanuel Owusu",
            duration: 2880,
          },
          {
            title: "Blessed Are the Merciful",
            description:
              "Mercy received becomes mercy given. Those who have tasted God's mercy cannot withhold it from others.",
            theme: "Compassion",
            scripture: "Matthew 5:7",
            quotations: JSON.stringify([
              {
                reference: "Matthew 5:7",
                text: "Blessed are the merciful: for they shall obtain mercy.",
              },
              {
                reference: "Lamentations 3:22-23",
                text: "It is of the Lord's mercies that we are not consumed, because his compassions fail not. They are new every morning.",
              },
              {
                reference: "James 2:13",
                text: "For he shall have judgment without mercy, that hath shewed no mercy; and mercy rejoiceth against judgment.",
              },
            ]),
            sequence: 5,
            datePreached: new Date("2025-02-09"),
            preacher: "Elder Daniel Mensah",
            duration: 2640,
          },
        ],
      },
    },
  })

  // ────────────────────────────────────────────────────────────
  // Ministries
  // ────────────────────────────────────────────────────────────
  await db.ministry.createMany({
    data: [
      {
        name: "Children's Ministry",
        description:
          "Nurturing the next generation in the fear and knowledge of the Lord through Sunday school and children's church.",
        leader: "Sister Grace Adjei",
        icon: "baby",
      },
      {
        name: "Youth Ministry (PIY)",
        description:
          "Pentecost Institute of Youth — empowering young people to live radical, Christ-centered lives.",
        leader: "Brother Samuel Tetteh",
        icon: "flame",
      },
      {
        name: "Women's Movement (PEMEM)",
        description:
          "Pentecost Women's Movement — equipping women to be godly wives, mothers, and leaders.",
        leader: "Mrs. Esther Owusu",
        icon: "heart",
      },
      {
        name: "Men's Ministry (PEMEM)",
        description:
          "Pentecost Men's Ministry — raising men of valour, integrity, and spiritual strength.",
        leader: "Elder Daniel Mensah",
        icon: "shield",
      },
      {
        name: "Evangelism & Missions",
        description:
          "Taking the gospel to our community and beyond — fulfilling the Great Commission.",
        leader: "Elder Kwabena Boateng",
        icon: "globe",
      },
      {
        name: "Music & Worship",
        description:
          "Leading the assembly into God's presence through Spirit-filled worship and praise.",
        leader: "Brother Joshua Ansah",
        icon: "music",
      },
    ],
  })

  console.log("✅ Seed complete!")
  console.log(`  Series: Foundations of Faith (${foundations.id})`)
  console.log(`  Series: Walking in the Spirit (${walking.id})`)
  console.log(`  Series: Kingdom Principles (${kingdom.id})`)
  console.log(`  Series: The Sermon on the Mount (${mount.id})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
