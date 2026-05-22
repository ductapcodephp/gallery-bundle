<?php

namespace AmzsCMS\GalleryBundle\Repository;

use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Entity\Picture;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Picture>
 */
class PictureRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Picture::class);
    }

    public function findByGallery(Gallery $gallery)
    {
        return $this->createQueryBuilder('p')
            ->where('p.gallery = :gallery and p.isArchived = false')
            ->setParameter('gallery', $gallery)->getQuery()->getResult();
    }

    //    /**
    //     * @return User[] Returns an array of User objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('u.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?User
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }

    public function findAllPicture($search)
    {
        $qb = $this->createQueryBuilder('p');
        $qb->where('p.isArchived = false');
        if(!empty($search)){
            $qb->andWhere('p.name LIKE :title or p.originalName LIKE :title');
            $qb->setParameter('title', '%'.$search.'%');
        }
        return $qb;
    }
}
